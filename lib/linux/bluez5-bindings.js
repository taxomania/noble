var debug = require('debug')('bindings');

var events = require('events');
var util = require('util');

var dbusClass = require('dbus');
var dbus = new dbusClass();

var NobleBindings = function() {
  this._devices = {};
  this._serviceUuids = {};
};

util.inherits(NobleBindings, events.EventEmitter);

var nobleBindings = new NobleBindings();

nobleBindings.init = function() {
  this._systemBus = dbus.getBus('system');
  
  this._systemBus.getInterface('org.bluez', '/', 'org.freedesktop.DBus.ObjectManager', function(err, objectManager){
    if (err){
      console.log(err);
      return;
    }


    objectManager.on('InterfacesAdded', function(object, interfaces){
      console.log('InterfacesAdded', interface);

      //if (interface['org.bluez.Device1']){
        //this.emit('discover', interface);
        //return;
      //}
      for(var interface in interfaces) {
        var properties = interfaces[interface];

        if (interface === 'org.bluez.Device1') {
          console.log(properties.object);
          var address = properties.Address;
          var advertisement = {
            localName: properties.Name,
            serviceUuids: []
          };
          var rssi = ((properties.RSSI ^ 0xFFFF) + 1) * -1;

          var uuids = properties.UUIDs || [];
          for (var i in uuids) {
            var uuid = uuids[i].split('-').join('');

            if (uuid.match(/^0000.{4}00001000800000805f9b/)) {
              uuid = uuid.substring(4, 8);
            }
            advertisement.serviceUuids.push(uuid);
          }

          this._systemBus.getInterface('org.bluez', object, interface, function(err, deviceInterface){
            if (err){
              console.log(err);
              return;
            }
            this._devices[address] = deviceInterface;
            this.emit('discover', address, advertisement, rssi);
          }.bind(this));

          var propertiesInterface = this._systemBus.getInterface('org.bluez', object, 'org.freedesktop.DBus.Properties', function(err, propertiesInterface){
            if (err){
              console.log(err);
              return;
            }
            propertiesInterface.on('PropertiesChanged', function(interface, changedProperties, invalidatedProperties) {
              if (interface === 'org.bluez.Device1') {
                for(var key in changedProperties) {
                  var value = changedProperties[key];

                  if (key === 'Connected') {
                    // this.emit(value ? 'connect' : 'disconnect', address);
                  } else if (key === 'UUIDs') {
                    this._serviceUuids[address] = value;
                    this.emit('connect', address);
                  }
                }
              }
            }.bind(this));  
          }.bind(this));
        }
      }
    }.bind(this));

    objectManager.on('InterfacesRemoved', function(object, interface){
      console.log('InterfacesRemoved', interface);
    });


    objectManager.GetManagedObjects['error'] = function(err){
      console.log(err);
    };

    objectManager.GetManagedObjects['finish'] = function(managedObjects){
      // TODO
      for (var object in managedObjects){
        var interface = managedObjects[object];
        if (object === '/org/bluez/hci1'){
          var adapter = interface['org.bluez.Adapter1'];
          if (adapter){
            this._systemBus.getInterface('org.bluez', object, 'org.bluez.Adapter1', function(err, adapterInterface){
              if (err){
                console.log(err);
                return;
              }
              this._adapterInterface = adapterInterface;
              for (var object in managedObjects){
                var interface = managedObjects[object];
                if (interface['org.bluez.Device1']){
                  if (this._adapterInterface){
                    this._adapterInterface.RemoveDevice(object);
                  }
                }
              }
              this.emit('stateChange', adapter.Powered ? 'poweredOn' : 'poweredOff');
            }.bind(this));
//            this.emit('stateChange', adapter.Powered ? 'poweredOn' : 'poweredOff');
          }
        }
      }
    }.bind(this);
    
    objectManager.GetManagedObjects();
  }.bind(this));
};

nobleBindings.startScanning = function(serviceUuids, allowDuplicates) {
  this._adapterInterface.StartDiscovery();
  this.emit('scanStart');
};

nobleBindings.stopScanning = function() {
  this._adapterInterface.StopDiscovery();
  this.emit('scanStop');
};

nobleBindings.connect = function(peripheralUuid) {
  var deviceInterface = this._devices[peripheralUuid];
  deviceInterface.Connect();
};

nobleBindings.disconnect = function(peripheralUuid) {
  var deviceInterface = this._devices[peripheralUuid];
  deviceInterface.Disonnect();
};

nobleBindings.updateRssi = function(peripheralUuid) {
  // not implemented
  var rssi = 127;

  this.emit('rssiUpdate', peripheralUuid, rssi);
};

nobleBindings.discoverServices = function(peripheralUuid, uuids) {
  var uuids = this._serviceUuids[peripheralUuid];
  var serviceUuids = [];

  for (var i in uuids) {
    var uuid = uuids[i].split('-').join('');

    if (uuid.match(/^0000.{4}00001000800000805f9b34fb$/)) {
      uuid = uuid.substring(4, 8);
    }
    
    serviceUuids.push(uuid);
  }

  this.emit('servicesDiscover', peripheralUuid, serviceUuids);
};

nobleBindings.discoverIncludedServices = function(peripheralUuid, serviceUuid, serviceUuids) {
  // not implemented
  var includedServiceUuids = [];

  this.emit('includedServicesDiscover', peripheralUuid, serviceUuid, includedServiceUuids);
};

nobleBindings.discoverCharacteristics = function(peripheralUuid, serviceUuid, characteristicUuids) {

};

nobleBindings.read = function(peripheralUuid, serviceUuid, characteristicUuid) {

};

nobleBindings.write = function(peripheralUuid, serviceUuid, characteristicUuid, data, notify) {

};

nobleBindings.broadcast = function(peripheralUuid, serviceUuid, characteristicUuid, broadcast) {

};

nobleBindings.notify = function(peripheralUuid, serviceUuid, characteristicUuid, notify) {

};

nobleBindings.discoverDescriptors = function(peripheralUuid, serviceUuid, characteristicUuid) {

};

nobleBindings.readValue = function(peripheralUuid, serviceUuid, characteristicUuid, descriptorUuid) {

};

nobleBindings.writeValue = function(uuid, serviceUuid, characteristicUuid, descriptorUuid, data) {

};

nobleBindings.init();

module.exports = nobleBindings;