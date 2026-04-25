const fs = require('fs');
const input = `[00:03.893] Pumunta <00:04.384> ako <00:04.831> sa <00:05.071> tindahan <00:05.853> ni <00:06.151> Aling <00:06.607> Nena 
 <00:07.146> Para <00:07.327> bumili <00:08.255> ng <00:08.595> suka <00:08.952> 

[00:10.522] Pagbayad <00:10.927> ko <00:11.278> aking <00:11.754> nakita 
 <00:12.545> Isang <00:13.044> dalagang <00:13.534> nakadungaw <00:14.340> sa <00:14.764> bintana <00:15.876> 

[00:16.865] Natulala <00:17.930> ako, <00:18.686> laglag <00:19.126> ang <00:19.366> puso <00:19.841> ko <00:20.072> 

[00:20.412] Nalaglag <00:20.887> rin <00:21.163> ang <00:21.406> sukang <00:21.718> hawak <00:22.414> ko <00:23.129> 

[00:23.662] Napasigaw <00:24.370> si <00:24.675> Aling <00:25.025> Nena 
 <00:25.613> Ako <00:26.092> naman <00:26.551> ay <00:26.811> parang <00:27.151> nakuryenteng <00:28.207> pusa! <00:28.755> 

[00:30.137] Ngunit <00:30.617> natanggal <00:31.118> ang <00:31.404> hiya 
 <00:31.875> Nang <00:32.283> nakita <00:32.709> ko <00:33.038> na <00:33.281> nakatawa <00:34.015> ang <00:34.486> dalaga <00:35.772> 

[00:36.703] Panay <00:37.126> ang <00:37.337> sorry <00:37.721> ko <00:38.292> sa <00:38.561> pagmamadali 
 <00:39.916> Nakalimutan <00:40.953> pa <00:41.230> ang <00:41.484> sukli <00:42.128> ko <00:42.876> 

[00:43.231] Pagdating <00:43.861> sa <00:44.191> bahay, <00:44.863> nagalit <00:45.435> si <00:45.723> nanay 
 <00:46.180> Pero <00:46.548> oks <00:46.804> lang <00:47.044> ako <00:47.407> ay <00:47.633> inlababo <00:48.311> nang <00:48.661> tunay 
 <00:49.658> Tindahan <00:51.171> ni <00:51.319> Aling <00:52.079> Nena 
 <00:52.932> Parang <00:53.311> isang <00:53.695> kuwentong <00:54.132> pampelikula 
 <00:56.331> Mura <00:56.586> na <00:56.831> at <00:57.047> sarisari <00:57.794> pa <00:58.089> ang <00:58.305> itinitinda 
 <00:59.273> Pero <00:59.524> ang <00:59.763> tanging <01:00.189> nais <01:00.604> ko <01:00.960> ay <01:01.128> 'di <01:01.358> nabibili <01:02.050> ng <01:02.386> pera <01:03.059> 

[01:04.512] Pumunta <01:05.093> ako <01:05.583> sa <01:05.808> tindahan, <01:06.571> kinabukasan 
 <01:07.681> Para <01:08.146> makipagkilala 
 <01:11.114> Ngunit <01:11.603> sabi <01:11.957> ni <01:12.168> Aling <01:12.576> Nena 
 <01:13.244> Habang <01:13.538> maaga'y <01:14.156> huwag <01:14.438> na <01:14.674> raw <01:14.933> akong <01:15.505> umasa 
 <01:17.698> Anak <01:17.962> niya'y <01:18.283> aalis <01:19.043> na <01:19.368> papuntang <01:19.910> Canada 
 <01:20.929> Tatlong <01:21.302> araw <01:21.643> na <01:21.865> lang <01:22.085> ay <01:22.330> ba-bye <01:23.130> na <01:23.777> 

 <01:24.238> Tindahan <01:25.541> ni <01:25.750> Aling <01:26.584> Nena 
 <01:27.490> Parang <01:27.910> isang <01:28.300> kuwentong <01:28.758> pampelikula 
 <01:30.789> Mura <01:31.029> na <01:31.393> at <01:31.561> sarisari <01:32.339> pa <01:32.679> ang <01:32.924> itinitinda 
 <01:33.802> Pero <01:34.124> ang <01:34.417> tanging <01:34.810> nais <01:35.168> ko <01:35.384> ay <01:35.599> 'di <01:36.080> nabibili <01:36.690> ng <01:36.896> pera 
 <02:08.706> Hindi <02:09.229> mapigil <02:09.651> ang <02:09.876> damdamin 
 <02:10.721> Ako'y <02:11.043> nagmakaawang <02:12.502> ipakilala <02:14.140> 

[02:15.200] Payag <02:15.531> daw <02:15.743> siya <02:16.001> kung <02:16.318> araw-araw 
 <02:17.360> Ay <02:17.600> meron <02:17.861> akong <02:18.147> binibili <02:18.843> sa <02:19.152> tinda <02:19.861> niya 
 <02:21.867> Ako'y <02:22.314> pumayag <02:23.002> at <02:23.389> pinakilala <02:24.790> niya 
 <02:25.185> Sa <02:25.396> kanyang <02:25.716> kaisa-isang <02:26.934> dalaga <02:28.054> 

[02:28.423] Ngunit <02:28.783> nang <02:29.076> makilala, <02:29.988> siya'y <02:30.278> tumalikod <02:31.390> na 
 <02:31.631> At <02:31.861> iniwan <02:32.380> akong <02:32.907> nakatanga 
 <02:36.395> Tindahan <02:37.852> ni <02:38.063> Aling <02:38.871> Nena 
 <02:39.716> Parang <02:40.090> isang <02:40.457> kuwentong <02:40.902> pampelikula 
 <02:42.996> Mura <02:43.245> na <02:43.441> at <02:43.693> sarisari <02:44.557> pa <02:44.820> ang <02:45.102> itinitinda 
 <02:45.982> Pero <02:46.374> ang <02:46.662> tanging <02:47.099> nais <02:47.445> ko <02:47.634> ay <02:47.892> 'di <02:48.141> nabibili <02:48.773> ng <02:48.985> pera 
 <02:49.519> Tindahan <02:50.992> ni <02:51.304> Aling <02:51.932> Nena 
 <02:52.830> Dito <02:53.199> nauubos <02:54.063> ang <02:54.262> aking <02:54.841> pera 
 <02:56.147> Araw-araw <02:56.927> ay <02:57.203> naghihintay 
 <02:57.977> O <02:58.159> Aling <02:58.493> Nena, <02:58.974> please <02:59.291> naman <02:59.696> maawa <03:00.319> ka-ahh <03:02.890> 

 <03:07.443> Wala, <03:08.490> ah, <03:09.422> wala, <03:10.662> ah 
 <03:11.591> Ah-ah-ah-ah
 <03:15.980> Wala, <03:16.762> ah, <03:18.019> wala, <03:18.907> ah 
 <03:20.498> Ah, <03:21.620> ah, <03:23.242> ah`;

function parseTime(t) {
    const parts = t.split(':');
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
}

const lines = input.split('\n');
const result = [];

for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    let lineStartTime = null;
    let lineStartMatch = line.match(/^\[(\d{2}:\d{2}\.\d{3})\]/);
    
    let restOfLine = line;
    
    if (lineStartMatch) {
        lineStartTime = parseTime(lineStartMatch[1]);
        restOfLine = line.substring(lineStartMatch[0].length);
    } else {
        let tagStartMatch = line.match(/^<(\d{2}:\d{2}\.\d{3})>/);
        if (tagStartMatch) {
            lineStartTime = parseTime(tagStartMatch[1]);
        }
    }
    
    const regex = /(?:<(\d{2}:\d{2}\.\d{3})>|^)([^<]*)/g;
    let match;
    
    let wordsInLine = [];
    let firstWord = true;

    while ((match = regex.exec(restOfLine)) !== null) {
        if(match[0] === '') break;
        let tagTime = match[1] ? parseTime(match[1]) : lineStartTime;
        let text = match[2];
        
        if (text) {
            wordsInLine.push({
                time: tagTime,
                text: text,
                clear: firstWord
            });
            firstWord = false;
        }
    }
    
    result.push(...wordsInLine);
}

fs.writeFileSync('lyrics.json', JSON.stringify(result, null, 2));
