# Firefox OS Camera Download ![Camera Download](https://raw.githubusercontent.com/SunboX/fxos_Camera_Download/master/src/style/icons/CameraDownload_84.png) 
This app allows to view and download images from any DLNA / uPnP enabled photo camera like the ones from Sony. It behaves like the Sony PlayMemories Mobile app and was tested using a Sony NEX-6 camera.

Connecting your camera with a Firefox OS smartphone via Wi-Fi you can enjoy sending high quality photos to your smartphone or tablet.

## How it works (using a Sony NEX-6)

* Turn on your camera, and select Menu → Playback → View on Smartphone
* The camera should now enabled the WiFi mode and present you the SSID and password
* Connect your Firefox OS device to the camera's WiFi using the given password
* Now start the "Camera Download" app on your Firefox OS device
* After some seconds, the NEX-6 camera should appear in the device list
* Touch the list entry
* Now you will see a thumbnail list of all the camera's images
* Check the checkbox of one or more images and press the download button at the bottom
* The images are imported to your SD card and are available in the Gallery app

## ToDo

* Update the header layout
* Add support to download multiple files at once
* Add support for videos
* Add support for other image types than `image/jpeg`

## Development

Dependencies are installed and managed via [npm](https://www.npmjs.com/), the [Node.js](https://nodejs.org/) package manager. This project requires stable Node.js versions `>= 0.8.0`. Odd version numbers of Node.js are considered unstable development versions.

Before setting up the project ensure that your npm is up-to-date by running `npm update -g npm` (this might require `sudo` on certain systems).

### Get all dependencies

**Mac OS X, Linux**
```bash
sh ./setup_after_checkout.sh
```

**Windows**
```bash
setup_after_checkout.bat
```

### Cleanup the code and build the packaged app

**Mac OS X, Linux**
```bash
sh ./build.sh
```

**Windows**
```bash
build.bat
```

During development I recommend using the [Universal Media Server](http://www.universalmediaserver.com/) instead of a real camera. It's more easily to restart, to change the media and it runs on your development machine.
Universal Media Server is a free and regularly updated media server capable of serving videos, audio and images to any DLNA-capable device.

## Screenshots

<img src="https://raw.githubusercontent.com/SunboX/fxos_Camera_Download/master/screenshots/2015-06-23-12-12-20.png" width="300"/>
<img src="https://raw.githubusercontent.com/SunboX/fxos_Camera_Download/master/screenshots/2015-06-23-12-13-20.png" width="300"/> 
<img src="https://raw.githubusercontent.com/SunboX/fxos_Camera_Download/master/screenshots/2015-06-23-12-13-45.png" width="300"/> 
<img src="https://raw.githubusercontent.com/SunboX/fxos_Camera_Download/master/screenshots/2015-06-23-12-13-57.png" width="300"/> 

## License

See [license](https://github.com/SunboX/fxos_Camera_Download/blob/master/LICENSE) file.
