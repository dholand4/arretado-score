export interface IOrderItem {
  id: string;
  label: string;
  description?: string;
}

export interface IOrderListProps {
  items: IOrderItem[];
  onChange: (ids: string[]) => void;
  onRemove?: (id: string) => void;
  disabled?: boolean;
  ariaLabel: string;
}
