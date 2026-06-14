import {
  Content,
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import type { ComputeInstanceCatalogItem } from '@osac/api-contracts/types';
import { type ReactNode, useEffect, useId, useRef } from 'react';
import { catalogItemSubtitle } from './catalogItemDisplay';
import { CatalogItemDetailContent } from './CatalogItemDetailContent';
import './CatalogItemDetailDrawer.css';

interface CatalogItemDetailDrawerProps {
  item: ComputeInstanceCatalogItem | null;
  onClose: () => void;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  hostClassName?: string;
}

export const CatalogItemDetailDrawer = ({
  item,
  onClose,
  actions,
  children,
  className,
  hostClassName,
}: CatalogItemDetailDrawerProps) => {
  const titleId = useId();
  const drawerTitleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (item) {
      drawerTitleRef.current?.focus();
    }
  }, [item]);

  const hostClass = ['catalog-item-detail-drawer-host', hostClassName].filter(Boolean).join(' ');
  const drawerClass = ['catalog-item-detail-drawer', className].filter(Boolean).join(' ');

  if (!item) {
    return <div className={hostClass}>{children}</div>;
  }

  return (
    <div className={hostClass}>
      <Drawer isExpanded isInline={false} position="right" className={drawerClass}>
        <DrawerContent
          panelContent={
            <DrawerPanelContent
              defaultSize="28rem"
              minSize="20rem"
              maxSize="40rem"
              className="catalog-item-detail-drawer__panel"
              aria-labelledby={titleId}
            >
              <DrawerHead className="catalog-item-detail-drawer__head">
                <Stack hasGutter={false}>
                  <StackItem>
                    <Title
                      headingLevel="h2"
                      size="xl"
                      tabIndex={-1}
                      id={titleId}
                      ref={drawerTitleRef}
                    >
                      {item.title}
                    </Title>
                  </StackItem>
                  <StackItem>
                    <Content component="small" className="catalog-item-detail-drawer__subtitle">
                      {catalogItemSubtitle(item)}
                    </Content>
                  </StackItem>
                </Stack>
                <DrawerActions>
                  {actions}
                  <DrawerCloseButton onClick={onClose} />
                </DrawerActions>
              </DrawerHead>
              <DrawerPanelBody className="catalog-item-detail-drawer__body">
                <CatalogItemDetailContent item={item} />
              </DrawerPanelBody>
            </DrawerPanelContent>
          }
        >
          <DrawerContentBody className="catalog-item-detail-drawer__main">
            {children}
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
