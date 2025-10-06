RUN time errors:

Uncaught runtime errors:
×
ERROR
stats.avg_completion.toFixed is not a function
TypeError: stats.avg_completion.toFixed is not a function
    at Dashboard (http://localhost:3000/static/js/bundle.js:93070:108)
    at renderWithHooks (http://localhost:3000/static/js/bundle.js:45683:22)
    at updateFunctionComponent (http://localhost:3000/static/js/bundle.js:49251:24)
    at beginWork (http://localhost:3000/static/js/bundle.js:50970:20)
    at HTMLUnknownElement.callCallback (http://localhost:3000/static/js/bundle.js:35939:18)
    at Object.invokeGuardedCallbackDev (http://localhost:3000/static/js/bundle.js:35983:20)
    at invokeGuardedCallback (http://localhost:3000/static/js/bundle.js:36040:35)
    at beginWork$1 (http://localhost:3000/static/js/bundle.js:55939:11)
    at performUnitOfWork (http://localhost:3000/static/js/bundle.js:55187:16)
    at workLoopSync (http://localhost:3000/static/js/bundle.js:55110:9)
ERROR
stats.avg_completion.toFixed is not a function
TypeError: stats.avg_completion.toFixed is not a function
    at Dashboard (http://localhost:3000/static/js/bundle.js:93070:108)
    at renderWithHooks (http://localhost:3000/static/js/bundle.js:45683:22)
    at updateFunctionComponent (http://localhost:3000/static/js/bundle.js:49251:24)
    at beginWork (http://localhost:3000/static/js/bundle.js:50970:20)
    at HTMLUnknownElement.callCallback (http://localhost:3000/static/js/bundle.js:35939:18)
    at Object.invokeGuardedCallbackDev (http://localhost:3000/static/js/bundle.js:35983:20)
    at invokeGuardedCallback (http://localhost:3000/static/js/bundle.js:36040:35)
    at beginWork$1 (http://localhost:3000/static/js/bundle.js:55939:11)
    at performUnitOfWork (http://localhost:3000/static/js/bundle.js:55187:16)
    at workLoopSync (http://localhost:3000/static/js/bundle.js:55110:9)
ERROR
stats.avg_completion.toFixed is not a function
TypeError: stats.avg_completion.toFixed is not a function
    at Dashboard (http://localhost:3000/static/js/bundle.js:93070:108)
    at renderWithHooks (http://localhost:3000/static/js/bundle.js:45683:22)
    at updateFunctionComponent (http://localhost:3000/static/js/bundle.js:49251:24)
    at beginWork (http://localhost:3000/static/js/bundle.js:50970:20)
    at beginWork$1 (http://localhost:3000/static/js/bundle.js:55917:18)
    at performUnitOfWork (http://localhost:3000/static/js/bundle.js:55187:16)
    at workLoopSync (http://localhost:3000/static/js/bundle.js:55110:9)
    at renderRootSync (http://localhost:3000/static/js/bundle.js:55083:11)
    at recoverFromConcurrentError (http://localhost:3000/static/js/bundle.js:54575:24)
    at performConcurrentWorkOnRoot (http://localhost:3000/static/js/bundle.js:54488:26)



PLease also make the following enhancements: 

1. Under the project details:
    - Include a risk assessment section which captures the following details:
        - Risk title
        - Risk detail
        - Frequency (High, Medium, Low)
        - Severity (High, Medium, Low)
    - the risk assessment window must be a modal window for the user to add new risks for the selected initiative
    - Allow to edit risk details 
    - Allow to delete a risk

2. Under project details please unclude a section for the metrics capturing on the INitiatives tab.
    - Currently there is nothing to capture the metrics for the project
    - Allow users to add new metrics or update or remove existing metrics. 


3. Dashboard improvements:

    - Please show a table with the in progress initiatives with the key details as a summary on the dashboard view. Show a progress bar for each initiave
    - Show a card for number of new initiaves
    - Show a Red, Amber, Green inidicator for each initive:
        - Green is on track
        - Amber is project at risk
        - Red is project is behind with challenges and issues
        - Allow the user to capture this on the initiatives page
