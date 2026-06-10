import {
  Card,
  CardBody,
  CardHeader,
  Content,
  Flex,
  FlexItem,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Radio,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import type { OsType } from '@osac/api-contracts/types';
import { GuestOsIcon } from '../../../shared/GuestOsIcon';
import { GUEST_OS_FAMILIES, OS_TYPES } from '../constants';
import type { UpdateFn, WizardState } from '../types';

const VERSION_PLACEHOLDER = 'Select a version…';
const NEED_OS_PLACEHOLDER = 'You need to choose an OS first.';

export const GuestOsStep = ({ state, update }: { state: WizardState; update: UpdateFn }) => {
  const familySelected = !!state.osFamilyNew;
  const versions = familySelected ? (OS_TYPES[state.osFamilyNew] ?? []) : [];

  return (
    <Stack hasGutter>
      <StackItem>
        <Title id="guest-os-heading" headingLevel="h2" size="xl">
          Guest operating system
        </Title>
        <Content component="p" className="pf-v6-u-color-text-subtle osac-wizard-step__intro">
          Choose a platform, then pick a specific version from the list below.
        </Content>
      </StackItem>
      <StackItem>
        <div className="osac-deploy-options" role="radiogroup" aria-labelledby="guest-os-heading">
          {GUEST_OS_FAMILIES.map((opt) => {
            const selected = state.osFamilyNew === opt.id;
            return (
              <div key={opt.id} className="osac-deploy-options__cell">
                <Card
                  id={`guest-os-card-${opt.id}`}
                  className="osac-deploy-options__card"
                  isCompact
                  isFullHeight
                  isClickable
                  isSelected={selected}
                  onClick={() => {
                    update('osFamilyNew', opt.id);
                    update('osTypeNew', '');
                  }}
                  ouiaId={`guest-os-option-${opt.id}`}
                >
                  <CardHeader className="osac-deploy-options__card-header">
                    <Flex
                      justifyContent={{ default: 'justifyContentSpaceBetween' }}
                      alignItems={{ default: 'alignItemsFlexStart' }}
                      className="osac-deploy-options__card-header-row"
                    >
                      <FlexItem>
                        <GuestOsIcon os={opt.id as OsType} size="lg" />
                      </FlexItem>
                      <FlexItem>
                        <Radio
                          id={`guest-os-radio-${opt.id}`}
                          name="guestOsFamily"
                          aria-label={opt.title}
                          isChecked={selected}
                          onChange={() => {
                            update('osFamilyNew', opt.id);
                            update('osTypeNew', '');
                          }}
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
                        <div className="osac-deploy-options__badge-slot" aria-hidden />
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
      <StackItem>
        <FormGroup label="Operating system version" fieldId="guest-os-version" isRequired>
          <FormSelect
            id="guest-os-version"
            value={familySelected ? state.osTypeNew : ''}
            isDisabled={!familySelected}
            onChange={(_e, value: string) => update('osTypeNew', value)}
          >
            <FormSelectOption
              value=""
              label={familySelected ? VERSION_PLACEHOLDER : NEED_OS_PLACEHOLDER}
              isPlaceholder
            />
            {versions.map((t) => (
              <FormSelectOption key={t} value={t} label={t} />
            ))}
          </FormSelect>
        </FormGroup>
      </StackItem>
    </Stack>
  );
};
