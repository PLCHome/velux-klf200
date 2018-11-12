# velux-klf200

> this is an Node for the API on the Velux&copy; KLF-200 io-homecontrol&copy; Gateway.
> (klf-200 provided by Velux&copy;. I'm not affiliated.)


This implementation is based on the velux-klf200-api.

For the latest updates see the [CHANGELOG.md](https://github.com/ChrisHanuta/velux-klf200-api/blob/master/CHANGELOG.md)

# Install
```
npm install velux-klf200
```
---

### The connect password is the WLAN-Password not the web config password
---

### Requirements
* Velux KLF-200 on LAN
---
# Debug
This API supported debugging. you have to set the environment variable DEBUG
```
set DEBUG=velux-klf200:*
```
---
### Promise
This NODE-Implementation works with promise.


## The value Object
The value is an Object, you can set the value to an explicit position or to an calculated position. when you set the value you can use either **rawValue** or **value** and **valueType**.
It's also possible to use an number instead an Object. Then the API use **Relative**.
- **rawValue** is the value as is.
- **value** is the calculated float value.
- **valueType** is then kind of the value. have a look: 'Access Method name for Standard Parameter'

```
Access Method name for |Description                                   |Range (Hex)   |Size (Dec)
Standard Parameter     |                                              |              |

Relative               |Relative value (0 – 100%)                     |0x0000–0xC800 |51201
Relative               |No feed-back value known                      |0xF7FF        |1
Percent+-              |Percentage point plus or minus (-100% – 100%) |0xC900-0xD0D0 |2001
Target                 |The target value for the parameter            |0xD100        |1
Current                |The current value for the parameter           |0xD200        |1
Default                |The default value for the parameter           |0xD300        |1
Ignore                 |Ignore the parameter field where this         |0xD400        |1
                       |Access Method is written                      |              |
```


License (MIT)
-------------
Copyright (c) 2018 Chris Traeger

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
