import { Content, Radio, Stack, StackItem, Title } from '@patternfly/react-core';
import type { UpdateFn, WizardState } from '../types';

export const BootSourceStep = ({ state, update }: { state: WizardState; update: UpdateFn }) => {
  return (
    <Stack hasGutter>
      <StackItem>
        <Title id="boot-source-heading" headingLevel="h2" size="xl">
          Boot source
        </Title>
        <Content component="p" className="pf-v6-u-color-text-subtle osac-wizard-step__intro">
          Choose how the virtual machine will start. You can attach storage later if needed.
        </Content>
      </StackItem>
      <StackItem>
        <div role="radiogroup" aria-labelledby="boot-source-heading">
          <Stack hasGutter>
            <StackItem>
              <Radio
                id="boot-volume"
                name="bootSource"
                label="Boot volume"
                description="Start the virtual machine with an existing disk image or volume from your workspace."
                isChecked={state.bootSource === 'volume'}
                onChange={() => update('bootSource', 'volume')}
              />
            </StackItem>
            <StackItem>
              <Radio
                id="boot-none"
                name="bootSource"
                label="No boot source"
                description="Create an empty virtual machine and attach an ISO or volume later."
                isChecked={state.bootSource === 'none'}
                onChange={() => update('bootSource', 'none')}
              />
            </StackItem>
          </Stack>
        </div>
      </StackItem>
    </Stack>
  );
};
