// Verbs of motion, perception, communication and action; qualities.
export const LEX_MORE = String.raw`
# ---------- perception & communication ----------
SEE | V @eyes:f4 p:B f:U at:tipI > @face:f14 p:D f:F at:palm d:0.3 | see,saw,seen,sight,behold,observe | high
LOOK | V @neutral:u10 p:D f:F > @far:u10 d:0.3 | look,looked,watch,gaze | high
WITNESS | V @eyes:f4 p:B f:U at:tipI > @neutral:f16 p:D f:F d:0.3 > B @neutral:f12u4 p:F f:U d:0.2 | witness,witnessed,testify,testimony | med
HEAR | 1 @ear:f3i2 p:F f:O at:tipI > @ear:f5i3 at:tipI d:0.12 ;x2 | hear,heard,hearing,listen | high
LISTEN | 3 @ear:f2 p:F f:U at:tipT > bentV d:0.15 ;x2 | listen,listened,pay attention | med
SAY | 1 @chin:f3 p:I f:U at:tipI > @chin:f14 f:F d:0.25 | say,said,tell,told,qul | high
TELL | =SAY | tell,inform | high
TALK | 4 @chin:f3 p:I f:U at:radial > @chin:f12 at:radial d:0.2 ;x2 | talk,speak,speech,spoke,converse | high
WORD | G @base.pipI:o2 p:B f:I at:tipI > @base.pipI d:0.1 ;x2 | 1 @neutral:u4 p:B f:U | word,words | med
NEWS | flatO @forehead:f2 p:B f:U > 5 @neutral:f12 p:U f:F d:0.35 | flatO @chest:f4 p:B f:U > 5 @neutral:f12d4 p:U f:F d:0.35 | news,inform,information,tidings,report | high
STORY | F @neutral:o2 p:I f:F > @neutral:o8 d:0.15 ;sym x2 | story,stories,narrative,tale,account | high
CALL | B @neutral:f14 p:B f:U > bentB @neutral:b2u4 d:0.3 | call,called,summon,invite | med
SHOUT | claw5 @mouth:f3 p:B f:U > @face:u10f14 d:0.25 ;face:mouthOpen=0.8,browUp=0.5 | shout,cry out,scream,blast,shriek | high
WHISPER | B @mouth:o4 p:I f:U at:radial > @mouth:o4f2 at:radial d:0.15 ;x2 face:lipsPress=0.2 | whisper,whisperer,whispering | high
ASK | 1 @neutral:u6f12 p:B f:U > X @neutral:u4f6 d:0.2 | ask,asked,question,request | high
ANSWER | 1 @mouth:o4f3 p:I f:U > @neutral:o6f14 p:D f:F d:0.3 ;sym | answer,respond,reply | high
COMMAND | 1 @mouth:f2 p:I f:U at:tipI > @neutral:u6f16 f:F d:0.2 ;face:browDown=0.4 | command,commanded,order,ordained | high
WARN | B @base.back:u3 p:D f:F > @base.back d:0.1 ;x2 | B @neutral p:D f:FI | warn,warning,warner | high
ANNOUNCE | 1 @mouth:o2f2 p:I f:U at:tipI > @neutral:o14u8f10 d:0.3 ;sym | announce,proclaim,declare,good news | high
PROVE | B @chin:f3 p:B f:U at:tipM > @base.palm p:U f:F d:0.3 | B @neutral p:U f:FI | prove,proof,clear evidence | high
SHOW | 1 @base.palm:b2 p:D f:F at:tipI > @base.palm:b2 at:tipI d:0.3 | B @neutral p:B f:U > @far:u2 d:0.3 | show,shown,display,demonstrate | high
EXPLAIN | F @neutral:o4 p:I f:F > @neutral:o4f8 d:0.15 ;alt x2 | explain,explanation,clarify | high

# ---------- motion ----------
COME | 1 @far:u6 p:U f:FU > @neutral:b6u8 f:U ~arc:u4 d:0.35 ;sym | come,came,arrive,approach | high
GO | 1 @neutral:b4u6 p:D f:U > @far:u2 f:F ~arc:u4 d:0.3 ;sym | go,went,gone,proceed | high
LEAVE | 5 @far:o6 p:D f:F > A @neutral:o14b6 d:0.3 ;sym | leave,left,abandon,forsake,depart | high
RETURN | bentB @far:u4 p:B f:U > @neutral:b8u6 d:0.3 ;sym | return,returned,come back,go back | high
ENTER | B @neutral:u4b4 p:D f:F > @neutral:d6f10 f:FD ~arc:u3 d:0.35 | B @neutral:f2 p:D f:FI | enter,entered,admit,go into | high
EXIT | 5 @base.palm:d2 p:D f:D > flatO @base.palm:u10 d:0.3 | C @neutral p:I f:F | exit,out,come out,bring out,emerge,extract | high
APPEAR | 1 @base.palm:d6 p:B f:U > @base.palm:u8 d:0.2 | B @neutral p:D f:FI | appear,appeared,emerge,show up | high
DISAPPEAR | 1 @base.palm:u6 p:B f:U > @base.palm:d8 d:0.2 | B @neutral p:D f:FI | disappear,vanish,gone | high
HIDE | 10 @chin p:I f:F at:tipT > @base.palm:d4 d:0.3 | B @neutral p:D f:FI | hide,hidden,conceal,secret,unseen | high
SECRET | 10 @lips p:I f:F at:tipT > @lips:f2 at:tipT d:0.1 ;x2 face:lipsPress=0.6 | secret,private,hidden | high
WALK | B @neutral:o8 p:D f:F > @neutral:o8f6 d:0.2 ;alt x2 | walk,walked,go about | high
RUN | L @neutral:o4 p:D f:F > @far:o4 ~wiggle:15 d:0.4 ;sym | run,ran,race,hasten | high
FLEE | 1 @base.palm:d4 p:D f:F > @neutral:o18f6u2 d:0.25 | B @neutral p:D f:FI | flee,fled,escape,run away | high
FOLLOW | 10 @neutral:o3f8 p:I f:F > @far:o3 d:0.35 | 10 @neutral:i3f4 p:I f:F > @far:i3 d:0.35 | follow,followed,pursue | high
LEAD | S @base.tipM at:radial p:I f:F > @base.tipM:f2 at:radial d:0.5 | B @neutral:f2 p:I f:F > @far:o6 d:0.5 | lead,led | high
GUIDE | =LEAD | guide,guided,guidance,show the way,rightly guided | med
MEET | 1 @neutral:o12 p:I f:U > @neutral:o3 d:0.3 ;sym | meet,met,encounter | high
GATHER | curved5 @far:o16 p:I f:F > S @neutral:b4o2 d:0.4 ;sym | gather,gathered,collect,assemble,amass | high
SCATTER | flatO @neutral:o2 p:D f:F > 5 @far:o20 d:0.35 ;sym | scatter,scattered,disperse,spread out | high
FALL | V @base.palm:u2 p:B f:D > @neutral:d8f10 p:U f:F ~arc:u6 d:0.35 | B @neutral p:U f:FI | fall,fell,drop,collapse | high
RAISE | B @neutral:d4 p:U f:F > @high:u0 d:0.35 ;sym | raise,raised,lift,elevate,rise | high
UP | 1 @neutral p:F f:U > @high:u6 d:0.25 | up,upward,ascend | high
DOWN | 1 @neutral:u4 p:B f:D > @neutral:d6 d:0.25 | down,downward,descend | high
CARRY | curvedB @neutral:o8 p:U f:F > @neutral:i4 d:0.4 ;sym | carry,carried,bear,load,burden | high
BRING | B @far:o4 p:U f:F > @neutral:b4 d:0.35 ;sym | bring,brought | high
PUT | flatO @neutral:b4 p:D f:F > @far:d2 ~arc:u4 d:0.3 ;sym | put,place,placed,set | high
THROW | S @shoulder:f4u6 p:F f:U > 5 @far:u4 p:D f:F d:0.2 | throw,threw,cast,hurl,fling | high
GIVE | flatO @neutral:b8 p:U f:F > @far:u4 d:0.3 | give,gave,given,grant,bestow | high
TAKE | 5 @far p:D f:F > S @neutral:b6 d:0.3 | take,took,seize,grab,catch | high
GET | curved5 @far:o4 p:I f:F > S @neutral:b4 d:0.3 ;sym | get,receive,obtain,acquire | high
HELP | 10 @base.palm at:ulnar p:I f:F > @base.palm at:ulnar d:0.35 | B @neutral:d4 p:U f:FI > @neutral:u8 d:0.35 | help,helper,support,aid,assist | high
SAVE | S @neutral:i3 p:B f:U > @neutral:o12 p:F d:0.3 ;sym | save,saved,rescue,deliver,safe,safety,secure | high
PROTECT | S @neutral:i3u2 p:I f:U > @neutral:i3u2f10 d:0.2 ;sym | protect,protection,defend,guard,refuge,shelter | high
SEEK-REFUGE | =ASK+PROTECT | seek refuge,take refuge | med
PREVENT | B @neutral:o4 p:I f:F > @neutral:f6o0 p:I ~arc:d3 d:0.25 | B @neutral:f2 p:B f:FI | prevent,prevented,block,hinder,obstruct | high
FORBID | L @base.palm:o10 p:I f:U at:ulnar > @base.palm:o1 at:ulnar d:0.15 | B @neutral p:I f:U | forbid,forbidden,prohibit,unlawful,haram | high
ALLOW | B @low:o6 p:I f:F > @neutral:o6u6 f:FU d:0.3 ;sym | allow,allowed,let,permit,permission,lawful | high
FIGHT | 1 @neutral:o6u2 p:B f:I > @neutral:o2u2 d:0.15 ;alt x2 | fight,fought,struggle,conflict,dispute,argue | med
KILL | 1 @neutral:o10 p:D f:FI > @neutral:o0d4 p:B d:0.3 | B @neutral p:D f:FI | kill,killed,slay,murder | high
DESTROY | claw5 @neutral:u6o4 p:D f:F > S @neutral:d4o4 d:0.35 | claw5 @neutral:d2 p:U f:F > S @neutral:u4 d:0.35 | destroy,destroyed,destruction,ruin,perish,annihilate | high
BREAK | S @neutral:o3 p:D f:F > @neutral:o8 p:B d:0.15 ;sym | break,broke,broken,crush,crushed | high
SHAKE | 5 @neutral:o8 p:D f:F > @neutral:o2 d:0.12 ;sym x3 face:eyesWide=0.4 | shake,quake,earthquake,tremble,convulse | high
STRIKE | S @neutral:o14u4 p:I f:F > @base.tipI at:knuckles d:0.15 | 1 @neutral:f4 p:B f:U | strike,hit,smite,struck,beat | high
BURN | =FIRE | burn,burned,burnt,scorch | high
BLOW | flatO @mouth:f4 p:B f:U > 5 @neutral:u10f14 d:0.25 ;face:puff=0.5 | blow,blown,breathe | med
TRUMPET | S @mouth:f3 p:I f:F | S @mouth:f10 p:I f:F | trumpet,horn | low
OPEN-DOOR | =DOOR | | med
BUILD | bentB @neutral:o2d2 p:D f:FI > @neutral:o2u8 d:0.3 ;alt | build,built,construct,structure | high
MAKE | =CREATE | make,made,do,did,does,doing | high
DO | C @neutral:f6 p:D f:F > @neutral:f6o8 d:0.15 ;sym x2 | do,did,does,done,deed,deeds,act,action | high
WORK | S @base.back:u3 p:D f:FI > @base.back:u0 d:0.1 ;x2 | S @neutral p:D f:FI | work,works,labor,deed,deeds | high
SLEEP | 5 @face:f4 p:B f:U > flatO @chin:f4 p:B f:U d:0.35 ;face:eyesClosed=1 | sleep,slept,asleep | high
REST | B @^chestSide:f2 p:B f:U | B @^chestSide:f2 p:B f:U | rest,repose,relax | high
WAKE | baby0 @eye:f2 p:F f:I > L d:0.2 ;sym face:eyesWide=0.6 | wake,awake,awaken | high
STAND | V @base.palm:u8 p:B f:D at:tipM > @base.palm:u0 at:tipM d:0.2 | B @neutral p:U f:FI | stand,stood,stand up,establish | high
ESTABLISH | A @base.back:u8 p:I f:F > @base.back:u1 d:0.25 | B @neutral p:D f:FI | establish,set up,maintain,keep up | high
WEIGH | =JUDGE | weigh,weight,measure | med
MEASURE | Y @neutral:o2 p:D f:F > @neutral:o6 d:0.12 ;sym x2 | measure,measured,measurement,proportion | high
COUNT | F @base.palm:d2 p:D f:F at:tipI > @base.palm:u6f6 at:tipI d:0.3 | B @neutral p:I f:U | count,counted,number,reckon,account | high
TEST | 1 @neutral:o6u8 p:F f:U > X @neutral:o6d2f6 p:D d:0.35 ;sym | test,trial,tried,examine | high
WIN | 1 @neutral:o10 p:B f:U > @high:o10 ~twist:30 d:0.4 ;sym face:smile=0.4 | win,success,succeed,successful,prosper,triumph,victory | high
FAIL | V @base.palm:b6 p:U f:F > @base.palm:f10 p:U f:FD ~arc:u3 d:0.35 | B @neutral p:U f:FI | fail,failure,failed | high
LOSE | flatO @neutral:o2 p:U f:F > 5 @neutral:d4o6 p:D d:0.25 ;sym | lose,lost,loss,loser,losers | high
ASTRAY | 1 @neutral:o2 p:D f:F > @far:o18 ~arc:o8 d:0.5 ;face:browInnerUp=0.4 | astray,go astray,stray,misguided,err,deviate | med
FIND | F @neutral:d2 p:D f:F > @neutral:u8 d:0.3 | find,found,discover | high
CHANGE | A @neutral:o3 p:I f:F > p:F d:0.25 ;sym | change,changed,turn,alter | high
TURN-AWAY | B @face:o4f10 p:F f:U > @face:o16f6 p:I d:0.3 ;face:headYaw=0.3 | turn away,turned away,avoid,shun | med
AVOID | A @neutral:f8 p:I f:F > @neutral:o14b2 d:0.35 | A @neutral:f4 p:I f:F | avoid,avoided,keep away,shun | high
DECEIVE | bentV @base.back:u2 p:D f:F > @base.back:u2o8 d:0.2 | S @neutral p:D f:FI | deceive,deceived,delude,cheat,trick | med
LIE | 1 @chin:o6 p:D f:I at:radial > @chin:i6 at:radial d:0.3 | lie,lied,liar,lies,falsehood | high
MOCK | Y @neutral:o6u4 p:D f:F > @neutral:o6u4f6 d:0.12 ;sym x2 | mock,mocked,ridicule,jest | high
PLAN | B @neutral:o8 p:I f:F > @neutral:o8f12 ~shake:1 d:0.4 ;sym | plan,plot,scheme,arrange | high
PREPARE | =PLAN | prepare,prepared,ready | high
KEEP | V @base.back:u4 p:D f:F > @base.back:u2 d:0.15 | V @neutral p:D f:FO | keep,guard,preserve,preserved,watch over | high
OWN | flatO @chest:f6 p:B f:U > @chest:f2 d:0.12 ;x2 | own,owner,possess,belong | med
POWER | S @chestSide:f10u6 p:B f:U > @chestSide:f8u4 f:UI d:0.2 ;sym | power,powerful,strong,strength,mighty,might,almighty | high
WEAK | claw5 @base.palm:u2 p:D f:D at:tipM > bent5 @base.palm:u1 d:0.15 ;x2 | B @neutral p:U f:FI | weak,weakness | high
NEW | curvedB @base.palm p:U f:FI > @base.palm:o8u4 ~arc:d2 d:0.3 | B @neutral p:U f:FI | new | high
OLD | S @chin:f2 p:I f:F > @chin:d10f2 d:0.3 | old,ancient | high
EASY | curvedB @base.back:f6 p:U f:F > @base.back:f8u6 d:0.15 ;x2 | curvedB @neutral p:U f:F | easy,ease,simple | high
HARD | bentV @neutral:u8 p:D f:F > @neutral:u2 d:0.12 | bentV @neutral:d2 p:U f:F | hard,difficult,difficulty,hardship,severe | high
BEAUTIFUL | 5 @face:f4 p:B f:U ~circle:F6x1 > flatO @chin:f6 d:0.2 | beautiful,beauty,pleasant,lovely | high
HEAVY | B @neutral:o8 p:U f:F > @neutral:o8d10 d:0.25 ;sym | heavy,weighty | high
LIGHT-WEIGHT | 5 @neutral:o8d2 p:U f:F > @neutral:o8u6 p:B d:0.25 ;sym | light,lightweight | high
DEEP | 1 @base.back:u2 p:B f:D > @low:d6 d:0.35 | B @neutral p:D f:FI | deep,depth,pit,abyss | high
FULL | B @neutral:u6o10 p:D f:I > @neutral:u6i6 d:0.25 | S @neutral:u2 p:I f:F | full,filled,fill | high
EMPTY | 1 @base.back:b4 p:D f:F at:tipM > @base.back:f8 d:0.25 | B @neutral p:D f:FI | empty,void | high
SAFE | =SAVE | safe,secure,security | high
PEACE | B @neutral:u6 p:I f:FU > @neutral:d4o10 p:D f:F d:0.4 ;sym | peace,peaceful,salam,tranquil,calm | high
BEST | B @chin p:B f:U at:tipM > 10 @temple:o12u4 p:B f:U d:0.35 | best,finest | high
BETTER | B @chin p:B f:U at:tipM > 10 @cheek:o12 p:B f:U d:0.3 | better,superior | high
WORST | =BAD+MOST | worst | med
BAD | =EVIL | bad | high
CRAZY | claw5 @temple:f3 p:B f:U ~twist:40 | crazy,mad,insane,possessed | high
MAGIC | S @neutral:o6u4 p:D f:F > 5 @far:o8u4 d:0.15 ;sym x2 | magic,sorcery,magician,sorcerer | high
POET | =fs:POET | poet,poets | low
NAME | H @base.pipI:u3 p:I f:FI > @base.pipI:u1 d:0.1 ;x2 | H @neutral p:I f:FI | name,named | high
BISMILLAH | =NAME+ALLAH | bismillah,in the name of allah | med | GDM uses a single sign
`;
