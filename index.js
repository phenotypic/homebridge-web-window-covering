var Service, Characteristic
const packageJson = require('./package.json')
const request = require('request')
const ip = require('ip')
const http = require('http')

module.exports = function (homebridge) {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-web-window-covering', 'WebWindowCovering', WebWindowCovering)
}

function WebWindowCovering (log, config) {
  this.log = log

  this.name = config.name
  this.apiroute = config.apiroute
  this.pollInterval = config.pollInterval || 300

  this.horizontalTilt = config.horizontalTilt || false
  this.verticalTilt = config.verticalTilt || false

  this.port = config.port || 2000
  this.requestArray = ['currentPosition', 'targetPosition', 'positionState', 'targetHorizontalTiltAngle', 'currentHorizontalTiltAngle', 'targetVerticalTiltAngle', 'currentVerticalTiltAngle']

  this.autoReset = config.autoReset || false
  this.autoResetDelay = config.autoResetDelay || 5

  this.manufacturer = config.manufacturer || packageJson.author.name
  this.serial = config.serial || this.apiroute
  this.model = config.model || packageJson.name
  this.firmware = config.firmware || packageJson.version

  this.username = config.username || null
  this.password = config.password || null
  this.timeout = config.timeout || 3000
  this.http_method = config.http_method || 'GET'

  if (this.username != null && this.password != null) {
    this.auth = {
      user: this.username,
      pass: this.password
    }
  }

  this.server = http.createServer(function (request, response) {
    var parts = request.url.split('/')
    var partOne = parts[parts.length - 2]
    var partTwo = parts[parts.length - 1]
    if (parts.length === 3 && this.requestArray.includes(partOne)) {
      this.log('Handling request: %s', request.url)
      response.end('Handling request')
      this._httpHandler(partOne, partTwo)
    } else {
      this.log.warn('Invalid request: %s', request.url)
      response.end('Invalid request')
    }
  }.bind(this))

  this.server.listen(this.port, function () {
    this.log('Listen server: http://%s:%s', ip.address(), this.port)
  }.bind(this))

  this.service = new Service.WindowCovering(this.name)
}

WebWindowCovering.prototype = {

  identify: function (callback) {
    this.log('Identify requested!')
    callback()
  },

  _httpRequest: function (url, body, method, callback) {
    request({
      url: url,
      body: body,
      method: this.http_method,
      timeout: this.timeout,
      rejectUnauthorized: false,
      auth: this.auth
    },
    function (error, response, body) {
      callback(error, response, body)
    })
  },

  _getStatus: function (callback) {
    var url = this.apiroute + '/status'
    this.log.debug('Getting status: %s', url)

    this._httpRequest(url, '', 'GET', function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error getting status: %s', error.message)
        this.service.getCharacteristic(Characteristic.PositionState).updateValue(new Error('Polling failed'))
        callback(error)
      } else {
        this.log.debug('Device response: %s', responseBody)
        var json = JSON.parse(responseBody)
        this.service.getCharacteristic(Characteristic.PositionState).updateValue(json.positionState)
        this.log.debug('Updated positionState to: %s', json.positionState)
        this.service.getCharacteristic(Characteristic.CurrentPosition).updateValue(json.currentPosition)
        this.log.debug('Updated currentPosition to: %s', json.currentPosition)
        this.service.getCharacteristic(Characteristic.TargetPosition).updateValue(json.targetPosition)
        this.log.debug('Updated targetPosition to: %s', json.targetPosition)
        if (this.verticalTilt) {
          this.service.getCharacteristic(Characteristic.CurrentVerticalTiltAngle).updateValue(json.currentVerticalTiltAngle)
          this.log.debug('Updated currentVerticalTiltAngle to: %s', json.currentVerticalTiltAngle)
          this.service.getCharacteristic(Characteristic.TargetVerticalTiltAngle).updateValue(json.targetVerticalTiltAngle)
          this.log.debug('Updated targetVerticalTiltAngle to: %s', json.targetVerticalTiltAngle)
        }
        if (this.horizontalTilt) {
          this.service.getCharacteristic(Characteristic.CurrentHorizontalTiltAngle).updateValue(json.currentHorizontalTiltAngle)
          this.log.debug('Updated currentVerticalTiltAngle to: %s', json.currentHorizontalTiltAngle)
          this.service.getCharacteristic(Characteristic.TargetHorizontalTiltAngle).updateValue(json.targetHorizontalTiltAngle)
          this.log.debug('Updated targetVerticalTiltAngle to: %s', json.targetHorizontalTiltAngle)
        }
        callback()
      }
    }.bind(this))
  },

  _httpHandler: function (characteristic, value) {
    switch (characteristic) {
      case 'positionState':
        this.service.getCharacteristic(Characteristic.PositionState).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'currentPosition':
        this.service.getCharacteristic(Characteristic.CurrentPosition).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'targetPosition':
        this.service.getCharacteristic(Characteristic.TargetPosition).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'targetHorizontalTiltAngle':
        this.service.getCharacteristic(Characteristic.TargetHorizontalTiltAngle).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'currentHorizontalTiltAngle':
        this.service.getCharacteristic(Characteristic.CurrentHorizontalTiltAngle).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'targetVerticalTiltAngle':
        this.service.getCharacteristic(Characteristic.TargetVerticalTiltAngle).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'currentVerticalTiltAngle':
        this.service.getCharacteristic(Characteristic.CurrentVerticalTiltAngle).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'obstructionDetected':
        this.service.getCharacteristic(Characteristic.ObstructionDetected).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        if (parseInt(value) === 1 && this.autoReset) {
          this.autoResetFunction()
        }
        break
      default:
        this.log.warn('Unknown characteristic "%s" with value "%s"', characteristic, value)
    }
  },

  setTargetPosition: function (value, callback) {
    var url = this.apiroute + '/setTargetPosition/' + value
    this.log.debug('Setting targetPosition: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting targetPosition: %s', error.message)
        callback(error)
      } else {
        this.log('Set targetPosition to %s', value)
        callback()
      }
    }.bind(this))
  },

  setTargetHorizontalTiltAngle: function (value, callback) {
    var url = this.apiroute + '/setState/' + value
    this.log.debug('Setting targetHorizontalTiltAngle: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting targetHorizontalTiltAngle: %s', error.message)
        callback(error)
      } else {
        this.log('Set targetHorizontalTiltAngle to %s', value)
        callback()
      }
    }.bind(this))
  },

  setTargetVerticalTiltAngle: function (value, callback) {
    var url = this.apiroute + '/setTargetVerticalTiltAngle/' + value
    this.log.debug('Setting targetVerticalTiltAngle: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting targetVerticalTiltAngle: %s', error.message)
        callback(error)
      } else {
        this.log('Set targetVerticalTiltAngle to %s', value)
        callback()
      }
    }.bind(this))
  },

  autoResetFunction: function () {
    this.log('Waiting %s seconds to autoreset obstruction detection', this.autoResetDelay)
    setTimeout(() => {
      this.service.getCharacteristic(Characteristic.ObstructionDetected).updateValue(0)
      this.log('Autoreset obstruction detection')
    }, this.autoResetDelay * 1000)
  },

  getServices: function () {
    this.informationService = new Service.AccessoryInformation()
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmware)

    this.service
      .getCharacteristic(Characteristic.TargetPosition)
      .on('set', this.setTargetPosition.bind(this))

    if (this.horizontalTilt) {
      this.service
        .getCharacteristic(Characteristic.TargetHorizontalTiltAngle)
        .on('set', this.setTargetHorizontalTiltAngle.bind(this))
    }

    if (this.verticalTilt) {
      this.service
        .getCharacteristic(Characteristic.TargetVerticalTiltAngle)
        .on('set', this.setTargetVerticalTiltAngle.bind(this))
    }

    this._getStatus(function () {})

    setInterval(function () {
      this._getStatus(function () {})
    }.bind(this), this.pollInterval * 1000)

    return [this.informationService, this.service]
  }

}
