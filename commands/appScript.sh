

npm install -g @google/clasp

clasp login

clasp create --title "Pennywise App Script" --type standalone

clasp push

## record the deployment ID, use next deployment to avoid duplicate deployments
clasp deploy --description "pennywise v1"

clasp deploy --deploymentId <DEPLOYMENT_ID_FROM_PREVIOUS_CMD> --description "pennywise v2"



## deploy to firebase hosting
npm run build && firebase deploy --only hosting
