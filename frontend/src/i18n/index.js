import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const common = {
  en: {
    translation: {
      "nav.dashboard":"Command Centre","nav.map":"Live Response Map","nav.incidents":"Incident Queue",
      "nav.resources":"Rescue Operations","nav.roads":"Road Network","nav.shelters":"Shelter Network",
      "nav.evacuation":"Evacuation","nav.alerts":"Official Alerts","nav.weather":"Weather",
      "nav.simulation":"Simulation","nav.analytics":"Analytics","nav.copilot":"AI Copilot",
      "nav.reports":"SITREP Reports","nav.contacts":"Emergency Contacts","nav.safety":"Safety",
      "nav.home":"Public Safety","nav.emergency":"Emergency","nav.myReports":"My Reports",
      "common.live":"LIVE","common.connected":"CONNECTED","common.offline":"OFFLINE",
      "common.demo":"DEMO DATA","common.cached":"CACHED DATA","common.official":"OFFICIAL",
      "common.selectState":"State","common.selectDistrict":"District","common.language":"Language",
      "common.logout":"Sign out","common.notifications":"Notifications",
      "dashboard.title":"District Command Centre","dashboard.subtitle":"The current operating picture — what requires action now",
      "dashboard.realtime":"REAL-TIME MONITORING","dashboard.activeIncidents":"Active incidents",
      "dashboard.availableUnits":"Available response units","dashboard.shelterOccupancy":"Shelter occupancy",
      "dashboard.river":"River situation","dashboard.priority":"Priority Queue",
      "dashboard.map":"Live Response Map","dashboard.readiness":"Response Readiness",
      "dashboard.activity":"Field Activity","dashboard.risk":"Flood Situation & Operational Risk",
      "emergency.report":"REPORT EMERGENCY","emergency.submit":"Submit emergency report",
      "emergency.useGps":"Use GPS","emergency.people":"People affected","emergency.description":"Description",
      "safety.before":"Before Flood","safety.during":"During Flood","safety.after":"After Flood",
      "safety.do":"DO","safety.dont":"DON'T"
    }
  },
  hi: {
    translation: {
      "nav.dashboard":"कमांड सेंटर","nav.map":"लाइव रिस्पॉन्स मानचित्र","nav.incidents":"घटना कतार",
      "nav.resources":"बचाव अभियान","nav.roads":"सड़क नेटवर्क","nav.shelters":"आश्रय नेटवर्क",
      "nav.evacuation":"निकासी","nav.alerts":"आधिकारिक चेतावनियाँ","nav.weather":"मौसम",
      "nav.simulation":"सिमुलेशन","nav.analytics":"विश्लेषण","nav.copilot":"AI सहायक",
      "nav.reports":"स्थिति रिपोर्ट","nav.contacts":"आपातकालीन संपर्क","nav.safety":"सुरक्षा",
      "nav.home":"सार्वजनिक सुरक्षा","nav.emergency":"आपातकाल","nav.myReports":"मेरी रिपोर्ट",
      "common.live":"लाइव","common.connected":"कनेक्टेड","common.offline":"ऑफलाइन",
      "common.demo":"डेमो डेटा","common.cached":"कैश्ड डेटा","common.official":"आधिकारिक",
      "common.selectState":"राज्य","common.selectDistrict":"जिला","common.language":"भाषा",
      "common.logout":"साइन आउट","common.notifications":"सूचनाएँ",
      "dashboard.title":"जिला कमांड सेंटर","dashboard.subtitle":"वर्तमान स्थिति — अभी किस कार्रवाई की आवश्यकता है",
      "dashboard.realtime":"रियल-टाइम मॉनिटरिंग","dashboard.activeIncidents":"सक्रिय घटनाएँ",
      "dashboard.availableUnits":"उपलब्ध प्रतिक्रिया इकाइयाँ","dashboard.shelterOccupancy":"आश्रय क्षमता उपयोग",
      "dashboard.river":"नदी की स्थिति","dashboard.priority":"प्राथमिकता कतार",
      "dashboard.map":"लाइव रिस्पॉन्स मानचित्र","dashboard.readiness":"प्रतिक्रिया तैयारी",
      "dashboard.activity":"फील्ड गतिविधि","dashboard.risk":"बाढ़ स्थिति और परिचालन जोखिम",
      "emergency.report":"आपातकाल रिपोर्ट करें","emergency.submit":"आपातकालीन रिपोर्ट भेजें",
      "emergency.useGps":"GPS उपयोग करें","emergency.people":"प्रभावित लोग","emergency.description":"विवरण",
      "safety.before":"बाढ़ से पहले","safety.during":"बाढ़ के दौरान","safety.after":"बाढ़ के बाद",
      "safety.do":"क्या करें","safety.dont":"क्या न करें"
    }
  },
  bn:{translation:{"nav.dashboard":"কমান্ড সেন্টার","nav.incidents":"ঘটনা তালিকা","nav.map":"লাইভ রেসপন্স ম্যাপ","nav.alerts":"সরকারি সতর্কতা","nav.shelters":"আশ্রয় কেন্দ্র","nav.weather":"আবহাওয়া","nav.contacts":"জরুরি যোগাযোগ","nav.safety":"নিরাপত্তা"}},
  te:{translation:{"nav.dashboard":"కమాండ్ సెంటర్","nav.incidents":"సంఘటనలు","nav.map":"లైవ్ రెస్పాన్స్ మ్యాప్","nav.alerts":"అధికారిక హెచ్చరికలు","nav.shelters":"ఆశ్రయ కేంద్రాలు","nav.weather":"వాతావరణం"}},
  mr:{translation:{"nav.dashboard":"कमांड सेंटर","nav.incidents":"घटना रांग","nav.map":"लाईव्ह रिस्पॉन्स नकाशा","nav.alerts":"अधिकृत इशारे","nav.shelters":"निवारा केंद्रे","nav.weather":"हवामान"}},
  ta:{translation:{"nav.dashboard":"கட்டளை மையம்","nav.incidents":"சம்பவங்கள்","nav.map":"நேரடி மீட்பு வரைபடம்","nav.alerts":"அதிகாரப்பூர்வ எச்சரிக்கைகள்","nav.shelters":"தங்குமிடங்கள்","nav.weather":"வானிலை"}},
  gu:{translation:{"nav.dashboard":"કમાન્ડ સેન્ટર","nav.incidents":"ઘટનાઓ","nav.map":"લાઇવ પ્રતિસાદ નકશો","nav.alerts":"સત્તાવાર ચેતવણીઓ","nav.shelters":"આશ્રયસ્થાનો","nav.weather":"હવામાન"}},
  kn:{translation:{"nav.dashboard":"ಕಮಾಂಡ್ ಸೆಂಟರ್","nav.incidents":"ಘಟನೆಗಳು","nav.map":"ಲೈವ್ ಪ್ರತಿಕ್ರಿಯೆ ನಕ್ಷೆ","nav.alerts":"ಅಧಿಕೃತ ಎಚ್ಚರಿಕೆಗಳು","nav.shelters":"ಆಶ್ರಯಗಳು","nav.weather":"ಹವಾಮಾನ"}},
  ml:{translation:{"nav.dashboard":"കമാൻഡ് സെന്റർ","nav.incidents":"സംഭവങ്ങൾ","nav.map":"ലൈവ് റെസ്പോൺസ് മാപ്പ്","nav.alerts":"ഔദ്യോഗിക മുന്നറിയിപ്പുകൾ","nav.shelters":"അഭയകേന്ദ്രങ്ങൾ","nav.weather":"കാലാവസ്ഥ"}},
  pa:{translation:{"nav.dashboard":"ਕਮਾਂਡ ਸੈਂਟਰ","nav.incidents":"ਘਟਨਾਵਾਂ","nav.map":"ਲਾਈਵ ਰਿਸਪਾਂਸ ਨਕਸ਼ਾ","nav.alerts":"ਅਧਿਕਾਰਤ ਚੇਤਾਵਨੀਆਂ","nav.shelters":"ਸ਼ੈਲਟਰ","nav.weather":"ਮੌਸਮ"}},
  or:{translation:{"nav.dashboard":"କମାଣ୍ଡ ସେଣ୍ଟର","nav.incidents":"ଘଟଣା","nav.map":"ଲାଇଭ୍ ପ୍ରତିକ୍ରିୟା ମାନଚିତ୍ର","nav.alerts":"ସରକାରୀ ସତର୍କତା","nav.shelters":"ଆଶ୍ରୟ","nav.weather":"ପାଣିପାଗ"}}
};
export const LANGUAGES=[
  ["en","English"],["hi","हिन्दी"],["bn","বাংলা"],["te","తెలుగు"],["mr","मराठी"],["ta","தமிழ்"],
  ["gu","ગુજરાતી"],["ur","اردو"],["kn","ಕನ್ನಡ"],["or","ଓଡ଼ିଆ"],["ml","മലയാളം"],["pa","ਪੰਜਾਬੀ"],
  ["as","অসমীয়া"],["mai","मैथिली"],["sa","संस्कृत"],["ks","कश्मीरी"],["ne","नेपाली"],["kok","कोंकणी"],
  ["sd","سنڌي"],["doi","डोगरी"],["mni","মৈতৈলোন"],["brx","बड़ो"],["sat","ᱥᱟᱱᱛᱟᱲᱤ"]
];
i18n.use(initReactI18next).init({
  resources:common,
  lng:localStorage.getItem("fg-language")||"en",
  fallbackLng:"en",
  interpolation:{escapeValue:false},
  returnEmptyString:false
});
i18n.on("languageChanged",lng=>localStorage.setItem("fg-language",lng));
export default i18n;
