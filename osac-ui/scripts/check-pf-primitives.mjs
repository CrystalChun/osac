import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const targetDirs = ['apps/app-frontend/src', 'libs/ui-components/src']
/** Tags that always require a nearby `pf-primitive-exception` comment (no spec budget). */
const bannedTagsAlwaysException = ['span', 'section', 'article', 'main', 'button']
/** Opening div tags: budget comes from ui-flow `ui_policy.max_raw_div_wrappers` for the file's flow/step. */
const divOpenPattern = /<\s*div\b/g
const allowedExceptionMarker = 'pf-primitive-exception'
// Lowercase HTML tags only — avoids matching JSX `<Button` from PatternFly.
const alwaysExceptionPattern = new RegExp(
  `<\\s*(${bannedTagsAlwaysException.join('|')})\\b`,
)

const docBlockPattern = /^\/\*\*([\s\S]*?)\*\//

/**
 * Slice the `steps:` document subtree so we do not pick up `- id:` from e.g. `branding_profiles`.
 */
function extractStepsSection(yamlText) {
  const start = yamlText.search(/\nsteps:\n/)
  if (start === -1) return ''
  const fromSteps = yamlText.slice(start)
  const endMatch = fromSteps.match(/\n(transitions|validation_rules):/)
  return endMatch ? fromSteps.slice(0, endMatch.index) : fromSteps
}

/**
 * @returns {Map<string, number>} key `flowSlug:stepId` -> max_raw_div_wrappers
 */
async function loadDivBudgetByFlowStep() {
  const map = new Map()
  const flowsDir = path.join(repoRoot, 'docs/specs/ui-flows')
  let entries = []
  try {
    entries = await readdir(flowsDir, { withFileTypes: true })
  } catch {
    return map
  }
  for (const ent of entries) {
    if (!ent.isFile() || !ent.name.endsWith('.yaml')) continue
    const flowSlug = ent.name.replace(/\.yaml$/, '')
    const fullPath = path.join(flowsDir, ent.name)
    const yamlText = await readFile(fullPath, 'utf8')
    const stepsSec = extractStepsSection(yamlText)
    if (!stepsSec) continue
    const chunks = stepsSec.split(/\n  - id: /).slice(1)
    for (const chunk of chunks) {
      const nl = chunk.indexOf('\n')
      const stepId = (nl === -1 ? chunk : chunk.slice(0, nl)).trim()
      if (!stepId) continue
      const body = nl === -1 ? '' : chunk.slice(nl)
      const m = body.match(/max_raw_div_wrappers:\s*(\d+)/)
      const max = m ? parseInt(m[1], 10) : 0
      map.set(`${flowSlug}:${stepId}`, max)
    }
  }
  return map
}

function maxBudgetForFlow(policyMap, flowSlug) {
  let max = 0
  const prefix = `${flowSlug}:`
  for (const key of policyMap.keys()) {
    if (key.startsWith(prefix)) max = Math.max(max, policyMap.get(key) ?? 0)
  }
  return max
}

function resolveDivBudget(policyMap, flowSlug, stepSingular, stepsListLine) {
  if (!flowSlug) return 0
  if (stepSingular) {
    return policyMap.get(`${flowSlug}:${stepSingular}`) ?? 0
  }
  const trimmed = stepsListLine?.trim() ?? ''
  if (trimmed) {
    // Arrow / glob prose (e.g. wizard comment) → use most permissive step in the flow.
    if (/[→*]/.test(trimmed)) {
      return maxBudgetForFlow(policyMap, flowSlug)
    }
    const ids = trimmed
      .split(',')
      .map((s) => s.trim())
      .filter((s) => /^\w+$/.test(s))
    if (ids.length > 0) {
      return Math.max(0, ...ids.map((id) => policyMap.get(`${flowSlug}:${id}`) ?? 0))
    }
  }
  return maxBudgetForFlow(policyMap, flowSlug)
}

/**
 * @returns {{ flow?: string, step?: string, stepsLine?: string }}
 */
function parseFlowDocBlock(source) {
  const m = source.match(docBlockPattern)
  if (!m) return {}
  const doc = m[1]
  const flow = doc.match(/^\s*\*?\s*flow:\s*([\w-]+)/im)?.[1]
  const step = doc.match(/^\s*\*?\s*step:\s*([\w_]+)/im)?.[1]
  const stepsLine = doc.match(/^\s*\*?\s*steps:\s*([^\n*]+)/im)?.[1]?.trim()
  return { flow, step, stepsLine }
}

function lineHasException(line, previousLine) {
  return (
    line.includes(allowedExceptionMarker) ||
    (previousLine && previousLine.includes(allowedExceptionMarker))
  )
}

function countDivOpensOnLine(line) {
  const matches = line.match(divOpenPattern)
  return matches ? matches.length : 0
}

function findNonDivViolations(filePath, source) {
  const lines = source.split(/\r?\n/)
  const violations = []
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (!alwaysExceptionPattern.test(line)) continue
    const previous = i > 0 ? lines[i - 1] : ''
    if (!lineHasException(line, previous)) {
      violations.push({ line: i + 1, content: line.trim(), kind: 'tag_requires_exception' })
    }
  }
  return violations
}

/**
 * @returns {{ violations: { line: number, content: string, kind: string }[], divUsed: number, divBudget: number }}
 */
function analyzeDivBudget(source, divBudget) {
  const lines = source.split(/\r?\n/)
  const violations = []
  let divUsed = 0
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const previous = i > 0 ? lines[i - 1] : ''
    const opens = countDivOpensOnLine(line)
    if (opens === 0) continue
    if (lineHasException(line, previous)) continue
    divUsed += opens
  }
  if (divUsed > divBudget) {
    violations.push({
      line: 0,
      content: `Raw <div> count ${divUsed} exceeds ui_policy budget ${divBudget} for this file (see docs/specs/ui-flows and file header flow/step).`,
      kind: 'div_over_budget',
    })
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i]
      const previous = i > 0 ? lines[i - 1] : ''
      if (countDivOpensOnLine(line) > 0 && !lineHasException(line, previous)) {
        violations.push({ line: i + 1, content: line.trim(), kind: 'div_counts_toward_budget' })
      }
    }
  }
  return { violations, divUsed, divBudget }
}

async function collectTsxFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectTsxFiles(fullPath)))
      continue
    }
    if (entry.isFile() && fullPath.endsWith('.tsx')) {
      files.push(fullPath)
    }
  }
  return files
}

async function main() {
  const policyMap = await loadDivBudgetByFlowStep()

  const existingTargetDirs = []
  for (const targetDir of targetDirs) {
    const fullPath = path.join(repoRoot, targetDir)
    try {
      const targetStats = await stat(fullPath)
      if (targetStats.isDirectory()) existingTargetDirs.push(fullPath)
    } catch {
      // Target directory may not exist in all workspaces.
    }
  }

  const allViolations = []
  for (const targetDir of existingTargetDirs) {
    const tsxFiles = await collectTsxFiles(targetDir)
    for (const file of tsxFiles) {
      const source = await readFile(file, 'utf8')
      const { flow, step, stepsLine } = parseFlowDocBlock(source)
      const divBudget = resolveDivBudget(policyMap, flow, step, stepsLine)
      const divAnalysis = analyzeDivBudget(source, divBudget)
      const nonDiv = findNonDivViolations(file, source)
      const violations = [...divAnalysis.violations, ...nonDiv]
      if (violations.length === 0) continue
      allViolations.push({
        file: path.relative(repoRoot, file),
        flow: flow ?? '(none)',
        divBudget,
        divUsed: divAnalysis.divUsed,
        violations,
      })
    }
  }

  if (allViolations.length === 0) {
    console.log(
      'PatternFly primitive guard passed: div usage within ui_policy budgets; other raw tags documented or absent.',
    )
    return
  }

  console.error(
    'PatternFly primitive guard failed. Align with docs/specs/ui-flows ui_policy.max_raw_div_wrappers (per file flow/step header), or add a nearby',
    `"${allowedExceptionMarker}"`,
    'comment for non-div raw tags / extra divs.',
  )
  for (const item of allViolations) {
    console.error(`\n${item.file}  [flow=${item.flow}  max_raw_div_wrappers=${item.divBudget}]`)
    for (const violation of item.violations) {
      const loc = violation.line > 0 ? `L${violation.line}` : '—'
      console.error(`  ${loc}: ${violation.content}`)
    }
  }
  process.exitCode = 1
}

main().catch((error) => {
  console.error('Failed to run PatternFly primitive guard:', error)
  process.exitCode = 1
})
