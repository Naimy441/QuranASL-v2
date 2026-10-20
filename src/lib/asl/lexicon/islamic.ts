// Islamic terms with community signs captured from Global Deaf Muslim videos
// (scripts/mocap). The parametric definition is only a fallback used before the
// captured motion has loaded or when it is unavailable.
export const LEX_ISLAMIC = String.raw`
ADHAN | =fs:ADHAN | adhan,call to prayer,athan | med | mocap:ADHAN
ALHAMDULILLAH | =PRAISE+ALLAH | alhamdulillah,all praise is due to allah,praise be to allah | med | mocap:ALHAMDULILLAH
ALLAHU-AKBAR | =ALLAH+GREAT | allahu akbar,allah is greatest,takbir | med | mocap:ALLAHU-AKBAR
ARABIC | =fs:ARABIC | arabic | med | mocap:ARABIC
SALAM | =PEACE | salam,assalamu alaykum,peace be upon you | med | mocap:SALAM
AYAH | =SIGN-PROOF | ayah,verse,verses,ayat | med | mocap:AYAH
DAWAH | =fs:DAWAH | dawah,invitation,call to islam | med | mocap:DAWAH
DEEN | =RELIGION | deen,din | med | mocap:DEEN
DUNYA | =WORLD+LIFE | dunya,this world,worldly life | med | mocap:DUNYA
HADITH | =fs:HADITH | hadith | med | mocap:HADITH
HAJJ | =fs:HAJJ | hajj | med | mocap:HAJJ
HALAL | =ALLOW | halal | med | mocap:HALAL
HARAM | =FORBID | haram,sacred,forbidden | med | mocap:HARAM
HELL.2 | =HELL | | med | mocap:HELL.2
IMAM | =LEAD+PERSON | imam,leader of prayer | med | mocap:IMAM
INSHAALLAH | =IF+ALLAH+WANT | insha allah,inshaallah,if allah wills,god willing | med | mocap:INSHAALLAH
ISLAM.2 | =ISLAM | | med | mocap:ISLAM.2
JUMUAH | =fs:JUMUAH | jumuah,friday,friday prayer | med | mocap:JUMUAH
KHUTBAH | =fs:KHUTBAH | khutbah,sermon | med | mocap:KHUTBAH
MASHALLAH | =ALLAH+WANT | mashallah,what allah willed | med | mocap:MASHALLAH
MUHAMMAD | =fs:MUHAMMAD | muhammad,ahmad | med | mocap:MUHAMMAD
PROPHET-MUHAMMAD | =PROPHET+MUHAMMAD | prophet muhammad,the prophet | med | mocap:PROPHET-MUHAMMAD
MUSLIM.2 | =MUSLIM | | med | mocap:MUSLIM.2
PARADISE.2 | =PARADISE | | med | mocap:PARADISE.2
RAMADAN | =fs:RAMADAN | ramadan | med | mocap:RAMADAN
SADAQAH | =CHARITY | sadaqah,voluntary charity,alms | med | mocap:SADAQAH
SALAH | =PRAY | salah,salat,prayer,pray,prayers | med | mocap:SALAH
SALAH.2 | =PRAY | | med | mocap:SALAH.2
SHAHADAH | =fs:SHAHADAH | shahadah,testimony of faith | med | mocap:SHAHADAH
SUBHANALLAH | =GLORY+ALLAH | subhanallah,glory be to allah,exalted is allah,glorify,exalt | med | mocap:SUBHANALLAH
UMMAH | =GROUP | ummah,muslim community,nation | med | mocap:UMMAH
UMRAH | =fs:UMRAH | umrah,lesser pilgrimage | med | mocap:UMRAH
WUDU | =WASH | wudu,ablution | med | mocap:WUDU
ZAKAT | =CHARITY | zakat,zakah,obligatory charity | med | mocap:ZAKAT
`;

/** Existing dictionary glosses that should play captured community signs when available. */
export const MOCAP_LINKS: Record<string, string> = {
  ALLAH: "ALLAH", PARADISE: "PARADISE", HELL: "HELL", ISLAM: "ISLAM", MUSLIM: "MUSLIM", QURAN: "QURAN",
  PROPHET: "PROPHET", MOSQUE: "MOSQUE", PILGRIMAGE: "HAJJ", FAST: "FAST", DUA: "DUA", VERSE: "AYAH",
  SURAH: "SURAH", BISMILLAH: "BISMILLAH", KAABA: "KAABA", PRAY: "SALAH",
};

// Prophet name signs (Global Deaf Muslim, "Names of 25 Prophets in Sign Language").
export const LEX_PROPHETS = String.raw`
ADAM | =fs:ADAM | adam | med | mocap:ADAM
IDRIS | =fs:IDRIS | idris,enoch,idrees | med | mocap:IDRIS
NUH | =fs:NUH | nuh,noah | med | mocap:NUH
HUD | =fs:HUD | hud | med | mocap:HUD
SALIH | =fs:SALIH | salih,saleh | med | mocap:SALIH
LUT | =fs:LUT | lut,lot | med | mocap:LUT
IBRAHIM | =fs:IBRAHIM | ibrahim,abraham | med | mocap:IBRAHIM
ISMAIL | =fs:ISMAIL | ismail,ishmael | med | mocap:ISMAIL
ISHAQ | =fs:ISHAQ | ishaq,isaac | med | mocap:ISHAQ
YAQUB | =fs:YAQUB | yaqub,jacob,israel | med | mocap:YAQUB
YUSUF | =fs:YUSUF | yusuf,joseph | med | mocap:YUSUF
SHUAYB | =fs:SHUAYB | shuayb,shuaib,jethro | med | mocap:SHUAYB
AYYUB | =fs:AYYUB | ayyub,job | med | mocap:AYYUB
DHULKIFL | =fs:DHULKIFL | dhul-kifl,dhulkifl,ezekiel | med | mocap:DHULKIFL
YUNUS | =fs:YUNUS | yunus,jonah,dhun-nun | med | mocap:YUNUS
MUSA | =fs:MUSA | musa,moses | med | mocap:MUSA
HARUN | =fs:HARUN | harun,aaron | med | mocap:HARUN
ILYAS | =fs:ILYAS | ilyas,elias,elijah | med | mocap:ILYAS
ALYASA | =fs:ALYASA | alyasa,al-yasa,elisha | med | mocap:ALYASA
DAWUD | =fs:DAWUD | dawud,david | med | mocap:DAWUD
SULAYMAN | =fs:SULAYMAN | sulayman,solomon | med | mocap:SULAYMAN
ZAKARIYYA | =fs:ZAKARIYYA | zakariyya,zechariah,zakariya | med | mocap:ZAKARIYYA
YAHYA | =fs:YAHYA | yahya,john | med | mocap:YAHYA
ISA | =fs:ISA | isa,jesus,the messiah | med | mocap:ISA
MUHAMMAD.2 | =fs:MUHAMMAD | | med | mocap:MUHAMMAD.2
`;
