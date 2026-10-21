// Religious & Islamic vocabulary. Many Islamic terms have community signs
// (Global Deaf Muslim, Muhsen). Entries marked "low" are parametric drafts that
// must be checked against those community signs by Deaf reviewers.
export const LEX_RELIGION = String.raw`
ALLAH | 1 @face:o4f6 p:F f:U > @aboveHead:o4f10 d:0.45 ;face:browUp=0.25 | allah,god | med | GDM: index finger raised upward (tawhid)
GOD | B @aboveHead:f6 p:I f:U > @chestHigh:f16 d:0.45 | god,deity,divinity | high | general ASL sign
LORD | L @^shoulder:f4 p:B f:I at:palm > @waist:o12f6 at:palm d:0.45 | lord,rabb,sustainer,master | med
FALSE-GOD | =FALSE+GOD | idol,idols,false god,false deity,taghut | med
PROPHET | =PREDICT+PERSON | prophet,prophets,nabi | med
PREDICT | V @eyes:f3 p:D f:F > @neutral:u6f14 d:0.35 | B @neutral:u10f8 p:D f:FI | predict,prophesy,foresee | high
MESSENGER | =SEND+PERSON | messenger,messengers,apostle,rasul | med
SEND | bentB @base.back:u2 p:D f:F at:tipM > B @base.back:f16u4 p:D f:F d:0.25 | B @neutral p:D f:FI | send,sent,dispatch | high
SEND-DOWN | B @aboveHead:o4f4 p:D f:F > @neutral:u6f12 d:0.45 | send down,sent down,revealed,revelation,descend | med | revelation coming down from above
REVEAL | flatO @aboveHead:o4f4 p:D f:F > 5 @neutral:u6f12 d:0.45 | reveal,inspire,inspiration,wahy | med
ANGEL | B @shoulder:f3 p:D f:B at:tipM > @side:u12 p:F f:U d:0.4 ~shake:1 ;sym | angel,angels | low
SPIRIT | F @base.tipI:u2 p:D f:F at:tipI > @high:u6 d:0.45 | F @neutral p:U f:F | spirit,soul,ruh | low
SOUL | =SPIRIT | soul,self,nafs | low
HEAVEN | B @high:o12 p:B f:FU > @aboveHead:f8 p:D f:F ~arc:u8 d:0.5 ;sym | heaven,heavens | high
PARADISE | B @high:o12 p:B f:FU > @aboveHead:f8 p:D f:F ~arc:u8 d:0.5 ;sym face:smile=0.4 | paradise,garden,gardens,jannah | low | GDM has a distinct sign
FIRE | 5 @low:o6f6 p:B f:U > @neutral:o6u10f6 ~wiggle d:0.4 ;sym | fire,flame,blaze,burn,burning | high
HELL | 5 @low:o6f6 p:B f:U > @neutral:o6u8f6 ~wiggle d:0.45 ;sym face:browDown=0.6,frown=0.5 | hell,hellfire,jahannam,inferno | low | GDM has a distinct sign
PRAY | B @neutral:f8u6 p:I f:U > @chest:f8u6 d:0.35 ;sym | pray,prayer,salah,salat,worship | low | GDM sign for salah differs
DUA | B @neutral:o5f10 p:U f:FU > @neutral:o5f10u2 d:0.4 ;sym face:browInnerUp=0.3 | supplication,invoke,dua,call upon | med | hands raised palms up
WORSHIP | A @neutral:f10u4 p:I f:F > @neutral:f4u4 d:0.4 | curvedB @neutral:f10u4 p:I f:F > @neutral:f4u4 d:0.4 | worship,serve,adore,ibadah | med
PROSTRATE | B @neutral:u6f6 p:D f:F > @low:f14 p:D f:F ~arc:u4 d:0.5 ;sym | prostrate,prostration,sujud,bow down | med
BOW | B @neutral:u4f8 p:D f:F > @neutral:d4f10 d:0.3 | B @neutral:d4f6 p:D f:FI | bow,bowing,ruku | low
ISLAM | =SUBMIT | islam | low | GDM has a distinct sign
SUBMIT | B @chest:o6f4 p:B f:I > openB @neutral:o8f8 p:U f:F d:0.4 ;sym | submit,submission,surrender | med
MUSLIM | =SUBMIT+PERSON | muslim,muslims | low | GDM has a distinct sign
RELIGION | R @heart:f1 p:B f:U > @neutral:u2f14 p:D f:F ~arc:u3 d:0.35 | religion,deen,faith,way of life | med
QURAN | Q @neutral:u6 p:D f:D > B @neutral:u2 p:I f:F d:0.3 > p:U d:0.2 | B @neutral:d2 p:I f:F > p:U d:0.25 | quran,koran,recitation | low | Q + BOOK draft
BOOK | B @neutral:f10 p:I f:F > p:U d:0.3 ;sym | book,scripture,record,register | high
PAGE | 1 @base.palm:u2 p:D f:F at:tipI > @base.palm:u2o8 p:U ~arc:u4 d:0.3 | B @neutral p:U f:FI | page,pages,scroll,scrolls,sheet | med
READ | V @base.palm:b4u4 p:D f:FD at:tipI > @base.palm:b4d4 d:0.4 | B @neutral:f6 p:B f:U | read,reading | high
RECITE | flatO @mouth:f2 p:B f:U > 5 @neutral:u10f14 p:U f:F d:0.35 | recite,recited,proclaim,iqra | low
WRITE | closedX @base.palm:u2 p:D f:F at:tipI > @base.palm:u2o6 ~shake:1 d:0.4 | B @neutral p:U f:FI | write,wrote,written,inscribe,pen | high
VERSE | =SIGN-PROOF | verse,ayah,ayat | low | GDM has a sign for ayah
SIGN-PROOF | B @chin:f3 p:B f:U at:tipM > @base.palm p:U f:F d:0.3 | B @neutral p:U f:FI | sign,signs,proof,evidence,ayat,miracle | med
SURAH | =CHAPTER | surah,chapter | low
CHAPTER | C @base.palm:u2 p:I f:F > @base.palm:d6 d:0.3 | B @neutral p:I f:U | chapter,section | high
HOLY | H @base.palm:u4 p:D f:F ~circle:U4x1 > B @base.palm:f8 d:0.25 | B @neutral p:U f:FI | holy,sacred,blessed | high
CLEAN | B @base.palm p:D f:F > @base.palm:f10 d:0.25 | B @neutral p:U f:FI | clean,pure,purify,purified,purity,cleanse | high
GLORY | B @base.palm p:D f:F > 5 @high:f10 p:F f:U ~shake:2 d:0.4 | B @neutral p:U f:FI | glory,glorify,exalt,subhan | med
PRAISE | B @neutral:u8f6o8 p:I f:FU > @neutral:u8f6o3 d:0.12 ;sym x2 face:smile=0.3 | praise,praised,hamd,praiseworthy | med
MERCY | open8 @neutral:f6 p:F f:U ~circle:F5x2 ;sym face:browInnerUp=0.3 | mercy,merciful,compassion,compassionate,rahma | med
GRACIOUS | =MERCY+ALL | most gracious,entirely merciful,rahman | low | Ar-Rahman: mercy that encompasses all
MERCIFUL | =MERCY+ALWAYS | most merciful,especially merciful,rahim | low | Ar-Raheem: continual mercy
KIND | B @chest:f6 p:B f:I ~circle:F6x1 | B @chest:f4 p:B f:FI | kind,kindness,gentle,benevolent | med
FORGIVE | B @base.palm p:D f:F > @base.palm:f8 d:0.2 ;x2 | B @neutral p:U f:FI | forgive,forgiving,forgiveness,pardon,excuse,forgiver | high
REPENT | =SORRY+AGAIN | repent,repentance,turn back,tawbah | med
BLESS | A @lips:o3 p:I f:U at:tipT > 5 @neutral:o8f10 p:D f:F d:0.4 ;sym | bless,blessing,blessed,favor,barakah | med
FAVOR | =BLESS | favor,favors,grace,bounty | med
REWARD | X @neutral:o8 p:I f:F > @far:o8 d:0.3 ;sym | reward,rewarded,recompense,gift | med
PAY | 1 @base.palm p:D f:F at:tipI > @base.palm:f12u4 d:0.2 | B @neutral p:U f:FI | pay,repay,compensate,due | high
PUNISH | 1 @neutral:u12o6 p:D f:FI > @neutral:d4i2 d:0.25 | S @neutral:u6 p:I f:U | punish,punishment,penalty,torment,chastise | med
SUFFER | 10 @chin p:I f:U at:tipT ~twist:30 ;face:browInnerUp=0.7,frown=0.5 | suffer,suffering,misery,anguish | high
PAIN | 1 @neutral:o4u4 p:B f:I ~twist:40 ;sym face:browInnerUp=0.6,squint=0.4 | pain,hurt,painful,agony | high
JUDGE | F @neutral:o8u4 p:I f:F > @neutral:o8d4 d:0.2 ;alt x2 | judge,judgment,judgement,justice,scale,scales,balance | high
JUDGMENT-DAY | =DAY+JUDGE | day of judgment,day of recompense,day of resurrection,last day | med
HEREAFTER | B @cheek:o8 p:I f:U > @far:u10o8 ~arc:u8 d:0.55 | hereafter,afterlife,akhirah,next life | low
RESURRECT | V @base.palm:u2 p:U f:F > @base.palm:u0 p:B f:D d:0.3 | B @neutral p:U f:FI | resurrect,resurrection,raise,raised,rise again,revive,bring back to life | med
GRAVE | curvedB @neutral:o6f8 p:D f:F > @neutral:o6b2 d:0.4 ;sym | grave,graves,tomb,bury,buried | high
DIE | B @neutral:o6 p:D f:F > p:U f:F d:0.4 | B @neutral:o6 p:U f:F > p:D d:0.4 | die,died,dead,death | high
LIFE | A @stomach:o8f3 p:B f:U > @chestHigh:o8f3 d:0.4 ;sym | life,live,living,alive | high
WORLD | W @base.back:u6 p:I f:U ~circle:I8x1 | W @neutral p:I f:U | world,worlds,universe,creation,dunya | med
WORLD-LIFE | =WORLD+LIFE | worldly life,life of this world,dunya | med
CREATE | S @base.back:u3 p:I f:F > @base.back:u3 p:B d:0.15 ;x2 | S @neutral p:I f:F | create,created,creator,make,made,maker | med
CREATION | =CREATE+THING | creation,creature,creatures | med
DEVIL | 3 @temple:u2 p:F f:UO at:tipT > bentV d:0.12 ;x2 | devil,satan,shaytan,iblis | med
JINN | =SPIRIT+PEOPLE | jinn | low
SIN | X @neutral:o6 p:B f:U ~circle:I4x2 ;sym | sin,sins,sinner,sinful,wrongdoing,crime | low
EVIL | B @chin p:B f:U at:tipM > @neutral:u2f8 p:D f:F d:0.3 ;face:frown=0.5 | evil,bad,wicked,harm,mischief | high
GOOD | B @chin p:B f:U at:tipM > @neutral:u0f6 p:U f:F d:0.3 | good,well,goodness,righteous,righteousness,virtue | high
RIGHTEOUS | =GOOD+PERSON | righteous,the righteous,pious | med
DISBELIEVE | =NOT+BELIEVE | disbelieve,disbelief,disbelieved,deny faith,kufr | high
DISBELIEVER | =NOT+BELIEVE+PERSON | disbeliever,disbelievers,unbeliever,kafir | med
BELIEVER | =BELIEVE+PERSON | believer,believers,mumin | high
HYPOCRITE | =FALSE+BELIEVE+PERSON | hypocrite,hypocrites | med
DENY | 10 @chin:o6d1 p:I f:U at:tipT > @neutral:o10f10 f:FU d:0.25 ;sym face:shake=0.12,browDown=0.5 | deny,denied,denial,reject,disbelieve | med
REJECT | B @base.palm:b6 p:D f:F > @base.palm:f14 p:D d:0.25 | B @neutral p:U f:FI | reject,refuse,turn away | high
OBEY | A @forehead:o6 p:B f:U > openB @neutral:o10f8 p:U f:F d:0.4 ;sym | obey,obedient,obedience | high
DISOBEY | A @temple:f2 p:B f:U > p:F d:0.2 ;face:browDown=0.4 | disobey,disobedient,rebel | high
FEAR-GOD | R @forehead:o4f2 p:I f:U > @neutral:u8f10 f:FU ~arc:f4 d:0.4 ;face:browInnerUp=0.3 | god-fearing,pious,mindful,taqwa,righteous,conscious | low | RESPECT form for taqwa
RESPECT | R @forehead:o4f2 p:I f:U > @neutral:u8f10 f:FU ~arc:f4 d:0.4 | respect,honor,revere | high
HONOR | H @forehead:o4 p:I f:U at:tipM > @neutral:u4f10 f:FU ~arc:f6 d:0.4 | honor,honored,noble,dignity,generous | high
FAST | F @lips:o4 p:B f:U at:tipI > @lips:i4 at:tipI d:0.3 | fast,fasting,sawm | low
CHARITY | flatO @chest:o6f4 p:U f:F > 5 @far:o8u2 p:U d:0.35 ;sym | charity,alms,zakah,zakat,sadaqah,spend | low | GDM has distinct signs for zakat/sadaqah
PILGRIMAGE | =fs:HAJJ | hajj,pilgrimage | low
MOSQUE | =fs:MASJID | mosque,masjid | low
KAABA | S @neutral:u4 p:D f:F > @neutral:u4 ~circle:U10x1 | S @neutral:o2 p:D f:F | kaaba,house,sacred house | low
TRUST | S @neutral:u6 p:I f:F > @neutral:u2 d:0.25 | S @neutral:u2 p:I f:F > @neutral:d2 d:0.25 | trust,rely,reliance,tawakkul | high
`;
