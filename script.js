import http from 'k6/http';
import { check } from 'k6';
import { RegistrationTest } from './tests/registerTest.js';
import { LoginTest } from './tests/loginTest.js';
import { BankAccountTest } from './tests/bankAccountRouteTest.js';
import { UploadTest } from './tests/uploadTest.js';
import { ProductTest } from './tests/productTest.js';

export const options = {
  // A number specifying the number of VUs to run concurrently.
  vus: 10,
  // A string specifying the total duration of the test run.
  duration: '30s',

  // The following section contains configuration options for execution of this
  // test script in Grafana Cloud.
  //
  // See https://grafana.com/docs/grafana-cloud/k6/get-started/run-cloud-tests-from-the-cli/
  // to learn about authoring and running k6 test scripts in Grafana k6 Cloud.
  //
  // ext: {
  //   loadimpact: {
  //     // The ID of the project to which the test is assigned in the k6 Cloud UI.
  //     // By default tests are executed in default project.
  //     projectID: "",
  //     // The name of the test in the k6 Cloud UI.
  //     // Test runs with the same name will be grouped.
  //     name: "script.js"
  //   }
  // },

  // Uncomment this section to enable the use of Browser API in your tests.
  //
  // See https://grafana.com/docs/k6/latest/using-k6-browser/running-browser-tests/ to learn more
  // about using Browser API in your test scripts.
  //
  // scenarios: {
  //   // The scenario name appears in the result summary, tags, and so on.
  //   // You can give the scenario any name, as long as each name in the script is unique.
  //   ui: {
  //     // Executor is a mandatory parameter for browser-based tests.
  //     // Shared iterations in this case tells k6 to reuse VUs to execute iterations.
  //     //
  //     // See https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/ for other executor types.
  //     executor: 'shared-iterations',
  //     options: {
  //       browser: {
  //         // This is a mandatory parameter that instructs k6 to launch and
  //         // connect to a chromium-based browser, and use it to run UI-based
  //         // tests.
  //         type: 'chromium',
  //       },
  //     },
  //   },
  // }
};

// The function that defines VU logic.
//
// See https://grafana.com/docs/k6/latest/examples/get-started-with-k6/ to learn more
// about authoring k6 scripts.
//
export default function () {
  NewUserJourneyTest()
}

function NewUserJourneyTest() {
  let user = {
    name: "",
    token: "",
    products: [],
    bankAccounts: [],
    imageUrls: []
  }

  console.log("registration test started")
  user = RegistrationTest(user, true)
  console.log("user token:", user.token)
  console.log("login test started")
  user = LoginTest(user, true)
  console.log("bank account test started")
  user = BankAccountTest(user, true)
  console.log("upload test started")
  user = UploadTest(user, true)
  console.log("product test started")
  user = ProductTest(user, true)
}










