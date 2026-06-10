import { BlueprintIcon } from '@patternfly/react-icons/dist/esm/icons/blueprint-icon';
import { CloneIcon } from '@patternfly/react-icons/dist/esm/icons/clone-icon';
import { DesktopIcon } from '@patternfly/react-icons/dist/esm/icons/desktop-icon';
/**
 * WIZARD_TEMPLATE_ONLY: this step is not mounted (wizard is template-only). Kept for RESTORE when
 * fulfillment supports "new" and "clone" creation methods — wire back in CreateVmWizard `renderStepBody`.
 */
import {
  Card,
  CardBody,
  CardHeader,
  Content,
  Flex,
  FlexItem,
  Label,
  Radio,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import type { DeploymentMode, UpdateFn, WizardState } from '../types';

const OPTIONS: {
  value: DeploymentMode;
  title: string;
  description: string;
  Icon: typeof DesktopIcon;
}[] = [
  {
    value: 'new',
    title: 'New virtual machine',
    description: 'Define a new instance from scratch. Then configure OS, storage, and networking.',
    Icon: DesktopIcon,
  },
  {
    value: 'template',
    title: 'Create from template',
    description: 'Provision from a catalog template with recommended CPU, memory, and disk.',
    Icon: BlueprintIcon,
  },
  {
    value: 'clone',
    title: 'Clone existing VM',
    description: "Duplicate an existing virtual machine's configuration as a starting point.",
    Icon: CloneIcon,
  },
];

export const DeploymentStep = ({ state, update }: { state: WizardState; update: UpdateFn }) => {
  return (
    <Stack hasGutter>
      <StackItem>
        <Title id="deployment-step-heading" headingLevel="h2" size="xl">
          Select a creation method
        </Title>
        <Content component="p" className="pf-v6-u-color-text-subtle osac-wizard-step__intro">
          Choose your preferred path to begin. We recommend creating from a template.
        </Content>
      </StackItem>
      <StackItem>
        <div
          className="osac-deploy-options"
          role="radiogroup"
          aria-labelledby="deployment-step-heading"
        >
          {OPTIONS.map((opt) => {
            const selected = state.mode === opt.value;
            const Icon = opt.Icon;
            return (
              <div key={opt.value} className="osac-deploy-options__cell">
                <Card
                  id={`deploy-card-${opt.value}`}
                  className="osac-deploy-options__card"
                  isCompact
                  isFullHeight
                  isClickable
                  isSelected={selected}
                  onClick={() => update('mode', opt.value)}
                  ouiaId={`deploy-option-${opt.value}`}
                >
                  <CardHeader className="osac-deploy-options__card-header">
                    <Flex
                      justifyContent={{ default: 'justifyContentSpaceBetween' }}
                      alignItems={{ default: 'alignItemsFlexStart' }}
                      className="osac-deploy-options__card-header-row"
                    >
                      <FlexItem>
                        <Icon className="osac-deploy-options__option-icon" aria-hidden />
                      </FlexItem>
                      <FlexItem>
                        <Radio
                          id={`deploy-radio-${opt.value}`}
                          name="createVmDeploymentMethod"
                          aria-label={opt.title}
                          isChecked={selected}
                          onChange={() => update('mode', opt.value)}
                        />
                      </FlexItem>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Stack hasGutter className="osac-deploy-options__card-body-stack">
                      <StackItem>
                        <Content component="h3" className="osac-deploy-options__option-title">
                          {opt.title}
                        </Content>
                      </StackItem>
                      <StackItem>
                        <div className="osac-deploy-options__badge-slot">
                          {opt.value === 'template' ? (
                            <Label color="blue" isCompact>
                              recommended
                            </Label>
                          ) : null}
                        </div>
                      </StackItem>
                      <StackItem>
                        <Content
                          component="p"
                          className="pf-v6-u-color-text-subtle osac-deploy-options__option-description"
                        >
                          {opt.description}
                        </Content>
                      </StackItem>
                    </Stack>
                  </CardBody>
                </Card>
              </div>
            );
          })}
        </div>
      </StackItem>
    </Stack>
  );
};
