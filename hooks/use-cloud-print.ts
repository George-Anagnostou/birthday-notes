import { useState } from 'react';

interface UseCloudPrintOptions {
  adminPassword: string;
}

export function useCloudPrint({ adminPassword }: UseCloudPrintOptions) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const printCards = async () => {
    setIsPrinting(true);
    setError(null);

    try {
      const response = await fetch('/api/cloud-print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({
          // No noteIds means print all cards
          encodeImages: false, // Use URLs by default
        }),
      });

      if (!response.ok) {
        // Try to parse error message
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.details || 'Failed to generate PDF');
        } else {
          const errorText = await response.text();
          throw new Error(errorText || `Server error: ${response.status}`);
        }
      }

      // Verify we got a PDF
      const contentType = response.headers.get('content-type');
      if (contentType !== 'application/pdf') {
        throw new Error(`Expected PDF but received ${contentType}`);
      }

      // Get the filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'birthday-cards.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsPrinting(false);
    }
  };

  return { printCards, isPrinting, error };
}
