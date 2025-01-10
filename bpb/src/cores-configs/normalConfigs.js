import { getConfigAddresses, generateRemark, randomUpperCase, getRandomPath } from './helpers';
import { getDataset } from '../kv/handlers';

export async function getNormalConfigs(request, env) {
    const { proxySettings } = await getDataset(request, env);
    const { 
        cleanIPs, 
        proxyIP, 
        ports, 
        vnpConfigs, 
        tnpConfigs , 
        outProxy, 
        customCdnAddrs, 
        customCdnHost, 
        customCdnSni, 
        enableIPv6
    } = proxySettings;
    
    let vnpConfs = '', tnpConfs = '', chainProxy = '';
    let proxyIndex = 1;
    const Addresses = await getConfigAddresses(cleanIPs, enableIPv6);
    const customCdnAddresses = customCdnAddrs ? customCdnAddrs.split(',') : [];
    const totalAddresses = [...Addresses, ...customCdnAddresses];
    const alpn = globalThis.client === 'singbox' ? 'http/1.1' : 'h2,http/1.1';
    const tnpPass = encodeURIComponent(globalThis.tnpPassword);
    const earlyData = globalThis.client === 'singbox' 
        ? '&eh=Sec-WebSocket-Protocol&ed=2560' 
        : encodeURIComponent('?ed=2560');
    
    ports.forEach(port => {
        totalAddresses.forEach((addr, index) => {
            const isCustomAddr = index > Addresses.length - 1;
            const configType = isCustomAddr ? 'C' : '';
            const sni = isCustomAddr ? customCdnSni : randomUpperCase(globalThis.hostName);
            const host = isCustomAddr ? customCdnHost : globalThis.hostName;
            const path = `${getRandomPath(16)}${proxyIP ? `/${encodeURIComponent(btoa(proxyIP))}` : ''}${earlyData}`;
            const vnpRemark = encodeURIComponent(generateRemark(proxyIndex, port, addr, cleanIPs, 'VLESS', configType));
            const tnpRemark = encodeURIComponent(generateRemark(proxyIndex, port, addr, cleanIPs, 'Trojan', configType));
            const tlsFields = globalThis.defaultHttpsPorts.includes(port) 
                ? `&security=tls&sni=${sni}&fp=randomized&alpn=${alpn}`
                : '&security=none';

            if (vnpConfigs) {
                vnpConfs += `${atob('dmxlc3M6Ly8=')}${globalThis.userID}@${addr}:${port}?path=/${path}&encryption=none&host=${host}&type=ws${tlsFields}#${vnpRemark}\n`; 
            }

            if (tnpConfigs) {
                tnpConfs += `${atob('dHJvamFuOi8v')}${tnpPass}@${addr}:${port}?path=/tr${path}&host=${host}&type=ws${tlsFields}#${tnpRemark}\n`;
            }
            
            proxyIndex++;
        });
    });

    if (outProxy) {
        let chainRemark = `#${encodeURIComponent('💦 Chain proxy 🔗')}`;
        if (outProxy.startsWith('socks') || outProxy.startsWith('http')) {
            const regex = /^(?:socks|http):\/\/([^@]+)@/;
            const isUserPass = outProxy.match(regex);
            const userPass = isUserPass ? isUserPass[1] : false;
            chainProxy = userPass 
                ? outProxy.replace(userPass, btoa(userPass)) + chainRemark 
                : outProxy + chainRemark;
        } else {
            chainProxy = outProxy.split('#')[0] + chainRemark;
        }
    }

    const configs = btoa(vnpConfs + tnpConfs + chainProxy);
    return new Response(configs, { 
        status: 200,
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'CDN-Cache-Control': 'no-store'
        }
    });
}