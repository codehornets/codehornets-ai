import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import client from '@/api/client';
import { toast } from 'sonner';

export default function ImportLeadsModal({ open, onOpenChange, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // Upload the file
      const { file_url } = await client.integrations.Core.UploadFile({ file });

      // Extract data from the file
      const response = await client.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            company: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            status: { type: 'string' },
            score: { type: 'number' },
            source: { type: 'string' }
          }
        }
      });

      if (response.status === 'error') {
        toast.error(response.details || 'Failed to extract data from file');
        setUploading(false);
        return;
      }

      // Normalize data to array
      const leadsData = Array.isArray(response.output) ? response.output : [response.output];

      // Import leads to database
      const createdLeads = await client.entities.Lead.bulkCreate(leadsData);

      setResults({
        success: true,
        count: createdLeads.length
      });

      toast.success(`Successfully imported ${createdLeads.length} leads`);
      
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      toast.error('Failed to import leads: ' + error.message);
      setResults({
        success: false,
        error: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResults(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Import Leads</DialogTitle>
          <DialogDescription className="text-slate-400">
            Upload a CSV file to import multiple leads at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!results ? (
            <>
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-slate-600 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {file ? (
                    <div className="space-y-3">
                      <FileText className="w-12 h-12 text-blue-400 mx-auto" />
                      <div>
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-slate-400 text-sm mt-1">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setFile(null);
                        }}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-12 h-12 text-slate-500 mx-auto" />
                      <div>
                        <p className="text-white font-medium">Click to upload CSV file</p>
                        <p className="text-slate-400 text-sm mt-1">
                          or drag and drop
                        </p>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              {/* CSV Format Guide */}
              <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                <h4 className="text-white font-medium text-sm">CSV Format Requirements:</h4>
                <ul className="text-slate-400 text-sm space-y-1">
                  <li>• Required columns: <code className="text-blue-400">name</code>, <code className="text-blue-400">email</code></li>
                  <li>• Optional columns: <code className="text-slate-300">company</code>, <code className="text-slate-300">phone</code>, <code className="text-slate-300">status</code>, <code className="text-slate-300">score</code>, <code className="text-slate-300">source</code></li>
                  <li>• Status values: new, contacted, qualified, unqualified</li>
                  <li>• Score should be between 0-100</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-slate-700 text-white hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!file || uploading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Leads
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Results */}
              <div className="text-center py-8">
                {results.success ? (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Import Successful!</h3>
                    <p className="text-slate-400">
                      Successfully imported {results.count} lead{results.count !== 1 ? 's' : ''}
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Import Failed</h3>
                    <p className="text-slate-400">{results.error}</p>
                  </>
                )}
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleClose}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}