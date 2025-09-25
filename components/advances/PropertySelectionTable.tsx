import React from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Select,
  SelectItem,
  Chip,
} from '@heroui/react';

interface Property {
  _id: string;
  address: {
    street: string;
    unit?: string;
    city: string;
    state: string;
  };
  monthlyRent: number;
  leaseEndDate?: number;
}

interface PropertySelectionTableProps {
  properties: Property[];
  selectedPropertyIds: Set<string>;
  propertyTermMonths: Record<string, number>;
  defaultTermMonths: number;
  onPropertyToggle: (propertyId: string) => void;
  onPropertyTermChange: (propertyId: string, months: number) => void;
  onSelectAll?: (selected: boolean) => void;
  readOnly?: boolean;
}

export function PropertySelectionTable({
  properties,
  selectedPropertyIds,
  propertyTermMonths,
  defaultTermMonths,
  onPropertyToggle,
  onPropertyTermChange,
  onSelectAll,
  readOnly = false,
}: PropertySelectionTableProps) {
  const calculateMonthsRemaining = (leaseEndDate?: number) => {
    if (!leaseEndDate) return 11;
    const now = Date.now();
    return Math.min(11, Math.floor((leaseEndDate - now) / (30 * 24 * 60 * 60 * 1000)));
  };

  return (
    <Table
      aria-label="Properties table"
      selectionMode="none"
      removeWrapper
      isHeaderSticky
      className="max-h-[450px]"
    >
      <TableHeader>
        <TableColumn key="select" className={readOnly ? "hidden" : ""}>
          <Checkbox
            isSelected={selectedPropertyIds.size === properties.length && properties.length > 0}
            isIndeterminate={selectedPropertyIds.size > 0 && selectedPropertyIds.size < properties.length}
            onValueChange={(isSelected) => onSelectAll?.(isSelected)}
            aria-label="Select all properties"
          />
        </TableColumn>
        <TableColumn key="property">Property</TableColumn>
        <TableColumn key="rent">Monthly Rent</TableColumn>
        <TableColumn key="months">Advance Months</TableColumn>
        <TableColumn key="amount">Advance Amount</TableColumn>
        <TableColumn key="max">Max Available</TableColumn>
      </TableHeader>
      <TableBody>
        {properties.map((property) => {
          const monthsRemaining = calculateMonthsRemaining(property.leaseEndDate);
          const propertyMonths = propertyTermMonths[property._id] || defaultTermMonths;
          const propertyAdvanceAmount = property.monthlyRent * propertyMonths * 0.9;

          return (
            <TableRow key={property._id}>
              <TableCell key="select" className={readOnly ? "hidden" : ""}>
                <Checkbox
                  isSelected={selectedPropertyIds.has(property._id)}
                  onValueChange={() => onPropertyToggle(property._id)}
                />
              </TableCell>
              <TableCell key="property">
                <div>
                  <p className="font-medium">{property.address.street}</p>
                  <p className="text-xs text-neutral-05">
                    {property.address.unit ? `Unit ${property.address.unit}, ` : ''}
                    {property.address.city}, {property.address.state}
                  </p>
                </div>
              </TableCell>
              <TableCell key="rent">${property.monthlyRent.toLocaleString()}</TableCell>
              <TableCell key="months">
                {selectedPropertyIds.has(property._id) && !readOnly ? (
                  <Select
                    size="sm"
                    selectedKeys={[propertyMonths.toString()]}
                    onSelectionChange={(keys) => {
                      const months = parseInt(Array.from(keys)[0] as string);
                      onPropertyTermChange(property._id, months);
                    }}
                    className="w-24"
                    aria-label="Select advance months"
                  >
                    {Array.from({ length: monthsRemaining - 1 }, (_, i) => i + 2).map(months => (
                      <SelectItem key={months.toString()} textValue={`${months} mo`}>
                        {months} mo
                      </SelectItem>
                    ))}
                  </Select>
                ) : selectedPropertyIds.has(property._id) ? (
                  <span className="font-medium">{propertyMonths} mo</span>
                ) : (
                  <span className="text-sm text-neutral-05">-</span>
                )}
              </TableCell>
              <TableCell key="amount">
                {selectedPropertyIds.has(property._id) ? (
                  <span className="font-medium">${Math.floor(propertyAdvanceAmount).toLocaleString()}</span>
                ) : (
                  <span className="text-sm text-neutral-05">-</span>
                )}
              </TableCell>
              <TableCell key="max">
                <Chip size="sm" variant="flat" className="bg-neutral-01">
                  {monthsRemaining} mo / ${Math.floor(property.monthlyRent * monthsRemaining * 0.9).toLocaleString()}
                </Chip>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}