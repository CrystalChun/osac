import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { Project } from '@osac/types';
import { useProjects } from '@osac/ui-components/api/v1/project';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { Timestamp } from '@osac/ui-components/components/Primitives/Timestamp';
import { SubtleContent } from '@osac/ui-components/components/SubtleContent/SubtleContent';
import { useSession } from '@osac/ui-components/hooks/use-session';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import ProjectStatusLabel from './ProjectStatusLabel';

const getProjectName = (project: Project): string => {
  if (project.metadata?.name === '') {
    return 'default';
  }
  return project.metadata?.name || project.id;
};

const ProjectListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role, tenantId } = useSession();
  const [search, setSearch] = useState('');

  const { data: projects = [], isLoading, error } = useProjects();

  const canCreate = role === 'tenant-admin';

  const filteredProjects = useMemo(() => {
    if (!search) {
      return projects;
    }
    const lowerSearch = search.toLowerCase();
    return projects.filter((project) => {
      const fullName = getProjectName(project);
      return fullName.toLowerCase().includes(lowerSearch);
    });
  }, [search, projects]);

  return (
    <ListPage
      title={t('Projects')}
      description={t('Organize resources with hierarchical projects.')}
      error={error}
      actions={
        canCreate && !!tenantId ? (
          <Button variant="primary" onClick={() => navigate('/projects/create')}>
            {t('Create project')}
          </Button>
        ) : undefined
      }
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup>
              <ToolbarItem>
                <SearchInput
                  placeholder={t('Search projects by name…')}
                  value={search}
                  onChange={(_e, v) => setSearch(v)}
                  onClear={() => setSearch('')}
                  aria-label={t('Search projects')}
                />
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
        {filteredProjects.length === 0 ? (
          <SubtleContent component="p">
            {search
              ? t('No projects match your search.')
              : t('No projects yet. Create one to get started.')}
          </SubtleContent>
        ) : (
          <Table aria-label={t('Projects')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Status')}</Th>
                <Th>{t('Created')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredProjects.map((project) => (
                <Tr key={project.id}>
                  <Td dataLabel={t('Name')}>{getProjectName(project)}</Td>
                  <Td dataLabel={t('Status')}>
                    <ProjectStatusLabel project={project} />
                  </Td>
                  <Td dataLabel={t('Created')}>
                    <Timestamp value={project.metadata?.creationTimestamp} />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </ListPageBody>
    </ListPage>
  );
};

export default ProjectListPage;
