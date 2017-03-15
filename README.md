appium-event-parser
===========

This is a simple CLI script to parse Appium event timings. What are event timings? When you pass the capability `eventTimings` with the value `true` to an Appium session, then when calling the get session capabilities command in your client (`GET /session/:id`) you will have an `events` key in the response object. This key contains information about Appium-internal events and when they occurred. This information is useful for profiling Appium or debugging Appium, and is not generally useful for users.

## Installation

```
npm install -g appium-event-parser
```

## Usage

First of all you need to have the output from `GET /session/:id` stored in a `.json` file somewhere. The best time to call `GET /session/:id` is right before calling `driver.quit()` so that you know you've received all the events you might care about.

### Timeline

You can build a timeline of the events from this session using `-t`:

```
appium-event-parser -t -i /path/too/response.json
```

Which will show something like:

```
                                     [xcodeDetailsRetrieved@0s]
     [appConfigured@0.951s, resetStarted@0.958s, resetComplete@0.959s, logCaptureStarted@1.06s]
                                                  |
                                                  |
                                                  |
                                                  |
                                                  |
                                              (32.126s)
                                                  |
                                                  |
                                                  |
                                                  |
                                                  |
                                                  |
                                        [simStarted@33.186s]
                                              (5.033s)
                          [appInstalled@38.219s, wdaStartAttempted@38.239s]
                                                  |
                                                  |
                                                  |
                                                  |
                                                  |
                                                  |
                                                  |
                                                  |
                                                  |
                                                  |
                                              (58.28s)
                                                  |
                                                  |
                                                  |
                                                  |
                                                  |
                                                  |
                                                  |
                                                  |
                                                  |
                                                  |
                                                  |
                                      [wdaStartFailed@96.519s]
                                                  |
                                              (10.725s)
                                                  |
                                                  |
                                    [wdaStartAttempted@107.244s]
                                                  |
                                              (11.949s)
                                                  |
                                                  |
                                   [wdaSessionAttempted@119.193s]
[wdaSessionStarted@123.705s, wdaPermsAdjusted@123.746s, wdaStarted@123.747s, orientationSet@124.146s]
```

### Comparison statistics

If you have a directory with lots of session capabilities `.json` files, you can get stastical information about certain events we care about in the XCUITest driver:

```
appium-event-parser -s -i /path/to/dir/with/jsons
```

And you'll get something like:

```
{ avgs:
   { simStartLength: 41.5121,
     wdaStartLength: 17.941200000000002,
     wdaSessionStartLength: 2.0113000000000003,
     numWdaStartAttempts: 1,
     numWdaSessionAttempts: 1 },
  stdevs:
   { simStartLength: 2.4527162269614475,
     wdaStartLength: 2.4414009420822302,
     wdaSessionStartLength: 0.13611102086164817,
     numWdaStartAttempts: 0,
     numWdaSessionAttempts: 0 } }
```

That's about it!
