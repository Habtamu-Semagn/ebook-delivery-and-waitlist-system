import * as Sentry from "@sentry/tanstackstart-react";

Sentry.init({
  dsn: "https://146c84cd357200d36c3faac8ce149e50@o4511719040024576.ingest.us.sentry.io/4511726947270656",

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});