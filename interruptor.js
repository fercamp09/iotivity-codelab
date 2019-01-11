var ocf = require('iotivity-node'),
    client = ocf.client;

ocf.device = Object.assign(ocf.device, {
    coreSpecVersion: 'ocf.1.0.0',
    dataModels: ['res.1.0.0']
});
// Helper functions /////////////////////////////////////////////////////////////////
// Stores the resource info of each switch found
var switchesFound;

// The html id of each device is formed by resource.deviceId + ':' + resource.resourcePath;

// Show text in the bottom status bar
function log(string) {
    document.getElementById('statusBar').innerHTML = string;
}

function serverError(error) {
    log('Server return error:', error.message);
}


// Delete resource from UI
function deleteResource(resource) {
    var id = this.deviceId + ':' + this.resourcePath;
    log('deleteResource(' + this.resourcePath + ')');

    var resource = switchesFound[id];
    if (resource) {
	// Remove listeners associated to the resource to be deleted
        resource.removeListener('update', observeResource);
        resource.removeListener('delete', deleteResource);
	// delete resource info
        delete switchesFound[id];

        var child = document.getElementById(id);
        var parent = child.parentElement;
        while (parent.id != 'resources')
            child = parent, parent = parent.parentElement;
        if (parent.childElementCount > 1)
            parent.removeChild(child);
        else {
            // remove from layout instead of from DOM
            parent.style.display = 'none';
        }
    }
}

// Add card to UI
function addResourceHolderToUI(resource) {
    var cards = document.getElementById('resources'),
        node = cards.firstElementChild;
    if (cards.style.display === 'none') {
        cards.style.display = 'block';
    } else {
        node = node.cloneNode(true);
        cards.appendChild(node);
    }
    node.getElementsByClassName('resourceUUID')[0].innerHTML = resource.deviceId;
    node.getElementsByClassName('resourcePath')[0].innerHTML = resource.resourcePath;
    // Register a listener to update (make a post) the resource when activated
    var checkbox = node.getElementsByClassName('checkbox')[0];
    checkbox.id = resource.deviceId + ':' + resource.resourcePath;
    checkbox.onclick = function() {
        var resource = switchesFound[this.id];
        resource.properties.value = this.checked;
        client.update(resource);
    }
}

// Delete all switch cards from UI
function purgeAllResourceHoldersFromUI() {
    var cards = document.getElementById('resources');
    while (cards.childElementCount > 1)
        cards.removeChild(cards.lastElementChild);
    cards.style.display = 'none';
}


// Handler to be executed when a resource is found
function resourceFound(resource) {
    log('Resource found: ' + resource.deviceId);
    var id = resource.deviceId + ':' + resource.resourcePath;
    // If it wasn't previously found, we add it to the switches found and add listeners to it.
    if (!switchesFound[id]) {
        switchesFound[id] = resource;
        resource.addListener('update', observeResource);
        resource.addListener('delete', deleteResource);
        resource.addListener('error' , serverError);
        addResourceHolderToUI(resource);
    }
}

// Observe resource
function observeResource(resource) {
    // Validates that the resource has the 'value' property
    if (('properties' in resource) && ('value' in resource.properties)) {
        var id = resource.deviceId + ':' + resource.resourcePath;
	// Update visual switch with the actual value of the resource
        document.getElementById(id).checked = resource.properties.value;
    }
}

// Executed when the discover button is activated
function discoverBinarySwitch() {
    log('Discovering...');
    // Start from zero, delete everything
    purgeAllResourceHoldersFromUI();
    switchesFound = {};
    client.on('error', serverError)
          .findResources({ 'resourceType': ['oic.r.switch.binary'] }, resourceFound).then(
        function() {
            log('findResources() successful');
        },
        function(error) {
            log('findResources() failed with ' + error);
        });
}

// Helper functions end  ////////////////////////////////////////////////////////////


