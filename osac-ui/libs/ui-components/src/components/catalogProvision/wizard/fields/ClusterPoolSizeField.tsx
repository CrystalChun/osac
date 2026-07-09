import { InputField } from '../../../Form/InputField';

interface ClusterPoolSizeFieldProps {
  poolName: string;
  isRequired?: boolean;
}

const ClusterPoolSizeField = ({ poolName, isRequired = false }: ClusterPoolSizeFieldProps) => {
  return (
    <InputField
      name={`spec.nodeSets.${poolName}.size`}
      label={''}
      fieldId={`cluster-pool-size-${poolName}`}
      isRequired={isRequired}
      type="number"
    />
  );
};

export default ClusterPoolSizeField;
