
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ReportNameInputProps {
  reportName: string;
  setReportName: (name: string) => void;
}

const ReportNameInput: React.FC<ReportNameInputProps> = ({ reportName, setReportName }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="report-name">Report Name</Label>
      <Input
        id="report-name"
        placeholder="Enter a name for this report"
        value={reportName}
        onChange={(e) => setReportName(e.target.value)}
        className="w-full"
      />
      <p className="text-sm text-gray-500">
        Give your report a meaningful name for easier reference
      </p>
    </div>
  );
};

export default ReportNameInput;
