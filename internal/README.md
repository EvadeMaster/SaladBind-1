## ⚠️ Important

### When will UnstableBind reach end-of-life?
UnstableBind will reach a maturity state and will be archived on January 1st, 2023.

## Miners
Links to miners listed in /internal/miners.json for convenience:

#### PhoenixMiner: https://phoenixminer.info/downloads
#### T-Rex: https://github.com/trexminer/T-Rex/releases
#### NBMiner: https://github.com/NebuTech/NBMiner/releases
#### TeamRedMiner: https://github.com/todxx/teamredminer/releases
#### lolMiner: https://github.com/Lolliedieb/lolMiner-releases/releases
#### XMRig: https://github.com/xmrig/xmrig/releases

## miners.json
Tip: When disabling algorithm, set the DAG value of the algorithm that you want to disable to `2147483647`, **DO NOT SET IT TO 0, -1 OR NULL** or else SaladBind will think that the algorithm is compatible because the GPU VRAM is higher than `0 or -1` or doesn't have a requirement `null`.

Algorithm  | Mineable | Get dag source from |
| ------------- | ------------- | ------------- |
| Ethash | ✅ (EthereumPoW) | https://minerstat.com/dag-size-calculator
| Etchash |  ✅ | https://minerstat.com/dag-size-calculator
| KawPow |  ✅ | https://minerstat.com/dag-size-calculator
| Autolykos2 | ✅ | https://minerstat.com/dag-size-calculator
| Octopus | ✅ | 7gb (estimated, this algorithm grows at least 1-1.5gb a year)
| BeamV3 (EQUI150-5)| ✅ | 2gb
| ZHash (EQUI144-5) | ✅ | 2gb
| RandomX | ✅ | DAG not required
| Ghostrider | ✅ | DAG not required

## Announcement.json
If your going to make your own announcement, increment the number in "number" by 1, It not that important. :)

*You can put anything in the number value, like `"number": "UhhAaron/SaladBind - Issued 1"` but it will show `Annoucement - No.UhhAaron/SaladBind - Issued 1`.*

![image](https://user-images.githubusercontent.com/93124920/191002509-8ec5dca1-c722-498d-86c6-efcaae099c89.png)

### Tip
* When writing announcements, it is recommended that you don't use [emoji](https://en.wikipedia.org/wiki/Emoji) 🔧📜🛠️⚠️🎉✅🐛🩹, or at least don't overuse it as some OS don't support emoji or have certain emoji.)

* When editing a JSON file, it is recommended that you use IDE or a JSON Validator.

Invalid JSON (Trailing comma)
```json
{
    "number": "2",
    "announcement": [
        "🔧 Under the hood",
        "Migrate from CodeQL v1 to CodeQL v2",
    ]
}

```
Valid JSON
```json
{
    "number": "2",
    "announcement": [
        "🔧 Under the hood",
        "Migrate from CodeQL v1 to CodeQL v2"
    ]
}

```
