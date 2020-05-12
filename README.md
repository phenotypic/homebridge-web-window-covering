<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="140"></a>
</p>

<span align="center">

# homebridge-web-window-covering

[![npm](https://img.shields.io/npm/v/homebridge-web-window-covering.svg)](https://www.npmjs.com/package/homebridge-web-window-covering) [![npm](https://img.shields.io/npm/dt/homebridge-web-window-covering.svg)](https://www.npmjs.com/package/homebridge-web-window-covering)

</span>

## Description

This [homebridge](https://github.com/nfarina/homebridge) plugin exposes a web-based valve to Apple's [HomeKit](http://www.apple.com/ios/home/). Using simple HTTP requests, the plugin allows you to open and close the window covering.

## Installation

1. Install [homebridge](https://github.com/nfarina/homebridge#installation-details)
2. Install this plugin: `npm install -g homebridge-web-window-covering`
3. Update your `config.json` file

## Configuration

```json
"accessories": [
     {
       "accessory": "WebWindowCovering",
       "name": "Window Covering",
       "apiroute": "http://myurl.com"
     }
]
```

### Core
| Key | Description | Default |
| --- | --- | --- |
| `accessory` | Must be `WebWindowCovering` | N/A |
| `name` | Name to appear in the Home app | N/A |
| `apiroute` | Root URL of your device | N/A |

### Optional fields
| Key | Description | Default |
| --- | --- | --- |
| `horizontalTilt` | Whether to expose horizontal tilt as a characteristic | `false` |
| `verticalTilt` | Whether to expose vertical tilt as a characteristic | `false` |
| `autoReset` | Whether obstruction detection should automatically change the state back to `0` after being triggered | `false` |
| `autoResetDelay` | Time (in seconds) until the obstruction detection will automatically reset (if enabled) | `5` |

### Additional options
| Key | Description | Default |
| --- | --- | --- |
| `pollInterval` | Time (in seconds) between device polls | `300` |
| `timeout` | Time (in milliseconds) until the accessory will be marked as _Not Responding_ if it is unreachable | `3000` |
| `port` | Port for your HTTP listener (only one listener per port) | `2000` |
| `http_method` | HTTP method used to communicate with the device | `GET` |
| `username` | Username if HTTP authentication is enabled | N/A |
| `password` | Password if HTTP authentication is enabled | N/A |
| `model` | Appears under the _Model_ field for the accessory | plugin |
| `serial` | Appears under the _Serial_ field for the accessory | apiroute |
| `manufacturer` | Appears under the _Manufacturer_ field for the accessory | author |
| `firmware` | Appears under the _Firmware_ field for the accessory | version |

## API Interfacing

Your API should be able to:

1. Return JSON information when it receives `/status`:
```
{
    "positionState": INT_VALUE,
    "currentPosition": INT_VALUE,
    "targetPosition": INT_VALUE
}
```

2. Open/close the garage when it receives:
```
/targetPosition?value=INT_VALUE_0_TO_100
```

3. Update `currentPosition` as it opens/closes by messaging the listen server:
```
/currentPosition?value=INT_VALUE_0_TO_100
```

4. Update `positionState` as it opens/closes by messaging the listen server:
```
/positionState?value=INT_VALUE_0_TO_2
```

5. Update `targetPosition` following a manual override by messaging the listen server:
```
/targetPosition?value=INT_VALUE_0_TO_100
```

6. Update `obstructionDetected` when an obstruction is detected by messaging the listen server (should notify `0` after obstruction moves unless `autoReset` is enabled):
```
/obstructionDetected?value=INT_VALUE_0_TO_1
```

### Optional

1. If `horizontalTilt` is enabled, update `currentHorizontalTiltAngle` as the angle changes:
```
/currentHorizontalTiltAngle?value=INT_VALUE_-90_TO_90
```

2. If `horizontalTilt` is enabled, update `targetHorizontalTiltAngle` following a manual override by messaging the listen server:
```
/targetHorizontalTiltAngle?value=INT_VALUE_-90_TO_90
```

3. If `verticalTilt` is enabled, update `currentVerticalTiltAngle` as the angle changes:
```
/currentVerticalTiltAngle?value=INT_VALUE_-90_TO_90
```

4. If `verticalTilt` is enabled, update `targetVerticalTiltAngle` following a manual override by messaging the listen server:
```
/targetVerticalTiltAngle?value=INT_VALUE_-90_TO_90
```

## PositionState Key

| Number | Name |
| --- | --- |
| `0` | Opening |
| `1` | Closing |
| `2` | Stationary |
