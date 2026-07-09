import { InputField } from '../../../Form/InputField';

interface ClusterPoolSizeFieldProps {
  rowIndex: number;
  isRequired?: boolean;
}

const ClusterPoolSizeField = ({ rowIndex, isRequired = false }: ClusterPoolSizeFieldProps) => {
  return (
    <InputField
      name={`spec.nodeSetRows.${rowIndex}.size`}
      label={''}
      fieldId={`cluster-node-set-size-${rowIndex}`}
      isRequired={isRequired}
      type="number"
    />
  );
};

export default ClusterPoolSizeField;
