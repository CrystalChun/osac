import { useParams } from 'react-router-dom';
import { Bullseye, PageSection, Spinner } from '@patternfly/react-core';

import { useComputeInstance } from '@osac/ui-components/api/v1/compute-instance';
import { VmDetails } from '@osac/ui-components/components/vm/DetailsPage/VmDetails';

const VmDetailsPage = () => {
  const { id } = useParams() as { id: string };

  const { data: vm, isLoading } = useComputeInstance(id);

  if (isLoading || !vm) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return (
    <PageSection isFilled>
      <VmDetails vm={vm} />
    </PageSection>
  );
};

export default VmDetailsPage;
