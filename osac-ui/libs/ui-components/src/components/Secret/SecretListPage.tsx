import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MenuToggle,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { Secret, Secrets } from '@osac/types';
import { cel } from '@osac/ui-components/api/cel';
import { useDeleteResource, useListResource } from '@osac/ui-components/api/use-resource';
import { SEARCH_PARAM, usePageFilter } from '@osac/ui-components/hooks/use-page-filter';
import { useProjectFilterQuery } from '@osac/ui-components/hooks/use-project-filter-query';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import ListPage from '../Page/ListPage';
import ListPageBody from '../Page/ListPageBody';
import ProjectFilter from '../Page/ProjectFilter';
import CreateButton from '../Primitives/CreateButton.tsx';
import { Timestamp } from '../Primitives/Timestamp';
import DeleteResourceModal from '../Resource/DeleteResourceModal';
import ResourceNameField from '../Resource/ResourceNameField';
import { SubtleContent } from '../SubtleContent/SubtleContent';

const SECRET_TYPE_LABEL = 'osac.openshift.io/secret-type';

const SecretListPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [deleteTarget, setDeleteTarget] = useState<Secret>();
  const [search, setSearch] = usePageFilter(SEARCH_PARAM);
  const projectFilter = useProjectFilterQuery<Secret>();
  const { data, isLoading, error } = useListResource(Secrets, {
    filter: cel<Secret>((filter) =>
      filter.and(
        projectFilter,
        search ? filter.field('metadata.name').contains(search) : undefined,
      ),
    ),
  });
  const mutate = useDeleteResource(Secrets);

  return (
    <>
      {deleteTarget && (
        <DeleteResourceModal
          onClose={() => setDeleteTarget(undefined)}
          onSuccess={() => setDeleteTarget(undefined)}
          variables={{ id: deleteTarget.id }}
          mutation={mutate}
          resourceName={deleteTarget.metadata?.name || ''}
          label={t('This permanently deletes the secret. This action cannot be undone.')}
          errorLabel={t('Failed to delete secret')}
        />
      )}
      <ListPage
        title={t('Secrets')}
        description={t(
          'Store credentials for use at launch. Encrypted at rest in the platform vault.',
        )}
        actions={<CreateButton to="/secrets/create">{t('Create secret')}</CreateButton>}
        error={error}
      >
        <ListPageBody isLoading={isLoading} error={error}>
          <Toolbar>
            <ToolbarContent>
              <ToolbarGroup>
                <ToolbarItem>
                  <ProjectFilter />
                </ToolbarItem>
                <ToolbarItem>
                  <SearchInput
                    placeholder={t('Search secrets')}
                    value={search}
                    onChange={(_e, v) => setSearch(v)}
                    onClear={() => setSearch('')}
                    aria-label={t('Search secrets')}
                  />
                </ToolbarItem>
              </ToolbarGroup>
            </ToolbarContent>
          </Toolbar>
          {!data?.items.length ? (
            <SubtleContent component="p">
              {search
                ? t('No secrets match your search.')
                : t('No secrets yet. Create one to get started.')}
            </SubtleContent>
          ) : (
            <Table aria-label={t('Secrets')} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t('Name')}</Th>
                  <Th>{t('Project')}</Th>
                  <Th>{t('Type')}</Th>
                  <Th>{t('Created')}</Th>
                  <Th aria-label={t('Actions')} />
                </Tr>
              </Thead>
              <Tbody>
                {data.items.map((secret) => (
                  <Tr key={secret.id}>
                    <Td dataLabel={t('Name')}>
                      <ResourceNameField resource={secret} />
                    </Td>
                    <Td dataLabel={t('Project')}>{secret.metadata?.project || t('Default')}</Td>
                    <Td dataLabel={t('Type')}>
                      {secret.metadata?.labels[SECRET_TYPE_LABEL] || t('Generic')}
                    </Td>
                    <Td dataLabel={t('Created')}>
                      <Timestamp value={secret.metadata?.creationTimestamp} />
                    </Td>
                    <Td dataLabel={t('Actions')} isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: t('Edit'),
                            onClick: () => navigate(`/secrets/${secret.id}/edit`),
                          },
                          {
                            title: t('Delete'),
                            onClick: () => setDeleteTarget(secret),
                          },
                        ]}
                        actionsToggle={({ onToggle, isOpen, toggleRef }) => (
                          <MenuToggle
                            ref={toggleRef}
                            variant="plain"
                            isExpanded={isOpen}
                            onClick={onToggle}
                            aria-label={t('Actions for {{name}}', { name: secret.metadata?.name })}
                          >
                            <EllipsisVIcon />
                          </MenuToggle>
                        )}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </ListPageBody>
      </ListPage>
    </>
  );
};

export default SecretListPage;
