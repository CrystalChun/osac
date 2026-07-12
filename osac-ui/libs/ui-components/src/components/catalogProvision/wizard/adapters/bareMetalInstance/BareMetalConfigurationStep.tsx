import type { BareMetalInstanceCatalogItem } from '@osac/types';

import OsacForm from '../../../../Form/OsacForm';
import UserDataField from '../../fields/UserDataField';

interface Props {
  catalogItem: BareMetalInstanceCatalogItem | null;
}

const BareMetalConfigurationStep = ({ catalogItem }: Props) => {
  return (
    <OsacForm>
      <UserDataField catalogItem={catalogItem} name="spec.userData" wirePath="spec.user_data" />
    </OsacForm>
  );
};

export default BareMetalConfigurationStep;
