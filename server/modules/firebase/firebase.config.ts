type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
  [k: string]: any;
};

function parseServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing");

  return JSON.parse(raw);
}

export const firebaseConfig = (() => {
  const serviceAccount = parseServiceAccount();

  return {
    serviceAccount,
    projectId: serviceAccount.project_id,
  };
})();
