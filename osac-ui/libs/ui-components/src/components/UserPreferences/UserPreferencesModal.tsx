import * as React from 'react';
import {
  Button,
  Form,
  FormGroup,
  MenuToggle,
  MenuToggleElement,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  SelectOption,
} from '@patternfly/react-core';

import { useSession } from '../../hooks/use-session';
import { Theme } from '../../hooks/use-theme';

const themeLabels: { [key in Theme]: string } = {
  system: 'System default',
  light: 'Light',
  dark: 'Dark',
};

type UserPreferencesModalProps = {
  onClose: VoidFunction;
};

const UserPreferencesModal: React.FC<UserPreferencesModalProps> = ({ onClose }) => {
  const { userTheme, setUserTheme } = useSession();
  const [themeExpanded, setThemeExpanded] = React.useState(false);

  return (
    <Modal isOpen variant="small" onClose={onClose}>
      <ModalHeader title="User preferences" />
      <ModalBody>
        <Form>
          <FormGroup label="Theme">
            <Select
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  style={{ width: '100%' }}
                  onClick={() => setThemeExpanded(true)}
                  isExpanded={themeExpanded}
                >
                  {themeLabels[userTheme]}
                </MenuToggle>
              )}
              selected={userTheme}
              onSelect={(_, value) => {
                setUserTheme(value as Theme);
                setThemeExpanded(false);
              }}
              aria-label="theme"
              isOpen={themeExpanded}
              onOpenChange={setThemeExpanded}
            >
              {(Object.keys(themeLabels) as Theme[]).map((theme) => (
                <SelectOption key={theme} value={theme}>
                  {themeLabels[theme]}
                </SelectOption>
              ))}
            </Select>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default UserPreferencesModal;
