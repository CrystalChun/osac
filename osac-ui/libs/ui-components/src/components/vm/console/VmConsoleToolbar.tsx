import { Button, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import CompressIcon from '@patternfly/react-icons/dist/esm/icons/compress-icon';
import ExpandIcon from '@patternfly/react-icons/dist/esm/icons/expand-icon';
import PasteIcon from '@patternfly/react-icons/dist/esm/icons/paste-icon';

import type { ConsoleUiConnectionState } from './console.types';
import { useTranslation } from '../../../hooks/useTranslation';

interface Props {
  connectionState: ConsoleUiConnectionState;
  isFullscreen: boolean;
  onPaste?: () => void;
  onToggleFullscreen: () => void;
}

const VmConsoleToolbar = ({
  connectionState,
  isFullscreen,
  onPaste,
  onToggleFullscreen,
}: Props) => {
  const { t } = useTranslation();
  const isConnected = connectionState === 'connected';
  const fullscreenDisabled = !isConnected;

  return (
    <Toolbar>
      <ToolbarContent>
        <ToolbarItem>
          <Button
            variant="secondary"
            icon={<PasteIcon />}
            isDisabled={!isConnected || !onPaste}
            onClick={onPaste}
          >
            {t('Paste from clipboard')}
          </Button>
        </ToolbarItem>
        <ToolbarItem>
          <Button
            variant="secondary"
            icon={isFullscreen ? <CompressIcon /> : <ExpandIcon />}
            aria-label={isFullscreen ? t('Exit full screen') : t('Full screen')}
            isDisabled={fullscreenDisabled}
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? t('Exit full screen') : t('Full screen')}
          </Button>
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );
};

export default VmConsoleToolbar;
