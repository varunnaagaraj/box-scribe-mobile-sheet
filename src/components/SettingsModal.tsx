
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Settings, ExternalLink } from 'lucide-react';

interface SettingsModalProps {
  webhookUrl: string;
  onSave: (url: string) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ webhookUrl, onSave, onClose }) => {
  const [url, setUrl] = useState(webhookUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto rounded-2xl border-0 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">Zapier Webhook URL</Label>
              <Input
                id="webhook-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500 mt-2">
                Connect your Google Sheets via Zapier webhook to sync box data automatically.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl">
              <h4 className="font-medium text-blue-800 mb-2">Setup Instructions:</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Create a new Zap in Zapier</li>
                <li>Use "Webhooks by Zapier" as trigger</li>
                <li>Choose "Catch Hook" trigger event</li>
                <li>Copy the webhook URL here</li>
                <li>Connect Google Sheets as action</li>
                <li>Map the webhook data to sheet columns</li>
              </ol>
              <a
                href="https://zapier.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mt-2"
              >
                Open Zapier <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 rounded-xl">
                Save Settings
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsModal;
