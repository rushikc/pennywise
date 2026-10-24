/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

interface GisCodeClient {
  requestCode: () => void;
}

interface GisCodeResponse {
  code?: string;
  error?: string;
}

interface Window {
  google?: {
    accounts: {
      oauth2: {
        initCodeClient: (config: {
          client_id: string;
          scope: string;
          ux_mode: 'popup' | 'redirect';
          access_type?: string;
          prompt?: string;
          callback: (response: GisCodeResponse) => void;
        }) => GisCodeClient;
      };
    };
  };
}
