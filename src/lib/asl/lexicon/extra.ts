// Aliases and additional signs needed by the Juz 'Amma glosses.
export const LEX_EXTRA = String.raw`
# ---------- aliases ----------
THEM | =THEY | them | high
THOSE | =THEY | those | high
HIS | =POSS-a | his | high
HER | =POSS-a | her,hers | high
HIM | =IX-a | him | high
WATCH | =LOOK | watch,observe | high
SO | =THEN | so,therefore,thus | med
STRONG | =POWER | strong,firm | high
CLEAR | =BRIGHT | clear,plain,evident | high
REMINDER | =REMEMBER | reminder,admonition | high
REMIND | =REMEMBER | remind | med
EACH | =EVERY | each | high
INSIDE | =IN | inside | high
JUDGMENT | =JUDGE | judgment,judgement,recompense | high
COUCH | =CHAIR | couch,couches | high
LIVE | =LIFE | live,dwell | high
ALIVE | =LIFE | alive | high
DECREE | =DECIDE | decree,destiny,qadr,power | med
PAIR | =TWO | pair,pairs | med
WISH | C @chestHigh p:B f:I > @stomach:u8 d:0.3 | wish,long for,desire | high
PREFER | =BETTER | prefer | med
OR | =WHICH | or,either | med
OUT | =EXIT | out | high
AT | =IX-b | at | low
OVER | =ABOVE | over | high
INSPIRE | =REVEAL | inspire,inspired | med
LET | =ALLOW | let | high
PROOF | =PROVE | proof | high
ATOM | =SMALL | atom,speck | med
SCALE | =JUDGE | scale,scales | med
PIT | =DEEP | pit,abyss | med
SURE | =TRUE | sure,certain,certainty | high
PLEASE | =ENJOY | please | high
ALREADY | =FINISH | already | high
LIQUID | =WATER | liquid,fluid | med
EXPECT | =HOPE | expect | high
COMPANION | =FRIEND | companion,companions | high
GIFT | =REWARD | gift | high
HARSH | =HARD | harsh,severe,rough | med
RACE | =COMPETE | race | med
ARRANGE | =PLAN | arrange,organize,manage | med
AWAKE | =WAKE | awake | high
UNSEEN | =NOT+SEE | unseen,invisible,ghayb | med
BURY | =GRAVE | bury | high
WRAP | =COVER | wrap,wrapped,folded | med
ESCAPE | =FLEE | escape | high
SOMEONE | =SOMETHING | someone,somebody | med
BLOCK | =PREVENT | block,veiled,barred | high
PURE | =CLEAN | pure | high
SPLIT | =OPEN | split,cleave | med
FLAT | =SPREAD | flat,flattened,level | med
WITNESSED | =WITNESS | witnessed | med
REPEAT | =AGAIN | repeat | high
TABLET | =BOOK | tablet | low
TRICK | =DECEIVE | trick | med
OATH | =SWEAR | oath | high
BUILDING | =BUILD | building,buildings,pillars | high
ROCK | =STONE | rock | high
CRUSH | =CRUSHER | crush | high
TONGUE | =MOUTH | tongue | med
LIP | =MOUTH | lip,lips | med
SLAVE | =SERVANT | slave | high
RELATIVE | =FAMILY | relative,kin | high
RISE | =RAISE | rise | high
RESULT | =LAST | result,outcome,consequence,end | med
LOST | =ASTRAY | lost | med
BURDEN | =RESPONSIBLE | burden | high
LOWEST | =LOW | lowest | high
PEN | =WRITE | pen | med
INTO | =IN | into | high
FAMILIAR | =KNOW | familiar,accustomed | med
FLAME | =FIRE | flame,flames | high
FIBER | =ROPE | fiber,fibre | low
ETERNAL | =FOREVER | eternal,everlasting,samad | med
TRANSGRESS | =EXCEED | transgress,transgressor,transgressors,exceed limits | med
TOO-MUCH | =EXCEED | too much,excessive | high
CORRUPT | =EVIL | corrupt,corruption | med
ENEMY | =OPPOSITE+PERSON | enemy,enemies,foe | high
CLOT | =BLOOD+SMALL | clot,clinging substance,alaq | low
DITCH | =DEEP | ditch,trench | low
SHAPE | =FORM | shape,shaped | high
PILLOW | =BED | pillow,cushion,cushions | low
EVEN | =fs:EVEN | even | low
ODD | =fs:ODD | odd | low
WOOL | =fs:WOOL | wool | low
CLAY | =fs:CLAY | clay | low
WILD | =fs:WILD | wild | low
RUST | =DARK+COVER | rust,stain | low
JOKE | =PLAY | joke,jest,amusement | med
DISAGREE | =THINK+OPPOSITE | disagree,dispute,differ | high
BACK | =BACK-BODY | back | med
GARDEN | flatO @neutral:d6o4 p:F f:U > 5 @neutral:u6o4 d:0.3 > flatO @neutral:d6o16 d:0.15 > 5 @neutral:u6o16 d:0.3 | garden,gardens,orchard | med

# ---------- new signs ----------
ABOUT | 1 @base.tipM:o3 p:D f:I ~circle:I4x1 | flatO @neutral p:B f:FI | about,concerning,regarding | high
DISASTER | claw5 @high:o10 p:D f:F > @neutral:o4d4 d:0.25 ;sym face:eyesWide=0.5,browDown=0.4 | disaster,calamity,catastrophe,overwhelming | med
BALANCE | B @neutral:o8 p:D f:F > @neutral:o8u4 d:0.2 ;alt x2 | balance,proportion,proportioned,fashioned | med
WOE | 5 @face:o4f8 p:F f:U > @neutral:o4d2 p:D d:0.3 ;face:browDown=0.7,frown=0.5 | woe | low
SEAL | S @base.palm:u8 p:D f:F > @base.palm:u1 d:0.15 | B @neutral p:U f:FI | seal,sealed,stamp | high
ADVISE | flatO @base.back:u2 p:D f:F > 5 @far:u2 d:0.3 | S @neutral p:D f:FI | advise,advice,counsel,enjoin,exhort | high
EACH-OTHER | 10 @base.back:u5 p:D f:F ~circle:I6x1 | 10 @neutral p:U f:F | each other,one another,mutually | high
MOVE | flatO @neutral:o2 p:D f:F > @neutral:o16 ~arc:u5 d:0.35 ;sym | move,moved,removed,set in motion | high
STAY | Y @neutral:u4 p:D f:F > @neutral:d2f4 d:0.3 | stay,remain,abide,dwell | high
LINE | 4 @neutral:o2 p:D f:FI > @neutral:o16 d:0.35 ;sym | line,lines,row,rows,rank,ranks | med
COMPETE | 10 @neutral:o6 p:I f:F > @neutral:o6f6 d:0.15 ;alt x2 | compete,competition,rivalry | high
SMALL | G @neutral:u6 p:B f:I > baby0 d:0.2 | small,tiny,minute | med
STAKE | 1 @neutral:u8 p:I f:D > @neutral:d2 d:0.2 | C @neutral:d4 p:I f:F | stake,stakes,peg,pegs | low
THICK | claw5 @neutral:o4 p:D f:F > @neutral:o4d3 d:0.15 ;sym x2 | thick,dense,lush,luxuriant | med
TASTE | open8 @lips p:B f:U at:tipM > @lips:f2 at:tipM d:0.1 ;x2 | taste,tasted | high
ENOUGH | B @base.radial:u3b4 p:D f:F > @base.radial:u3f8 d:0.25 | S @neutral p:I f:F | enough,sufficient,suffice | high
BETWEEN | B @base.radial:u5 p:I f:F at:ulnar > @base.radial:u5o2 at:ulnar d:0.1 ;x2 | V @neutral p:I f:F | between,among | high
VALLEY | B @neutral:o16u6 p:F f:FI > @neutral:o2d4 d:0.35 ;sym | valley | high
RESPONSIBLE | bentB @shoulder:u4 p:D f:B at:tipM > @shoulder:u1 at:tipM d:0.12 ;x2 | responsible,responsibility,duty | high
POUR | C @neutral:u8o4 p:I f:U > p:D f:I d:0.3 | pour,poured | high
REMOVE | curvedB @base.palm:u2 p:D f:F > A @low:o10 d:0.3 | B @neutral p:U f:FI | remove,removed,take away | high
BREATHE | B @chest:f4o3 p:B f:I > @chest:f10o3 d:0.3 ;sym x2 | breathe,breath,breathing,pant | high
STINGY | claw5 @chin p:B f:U at:tipM > S @chin:d6 d:0.25 | stingy,miser,withhold | high
GENEROUS | B @chest:f4o4 p:B f:I > @neutral:f12o6 p:U d:0.3 ;sym | generous,generosity,most generous,karim | med
FORM | B @neutral:u10o6 p:I f:F > @neutral:d6o6 ~arc:o6 d:0.4 ;sym | form,forms,figure | high
STAGE | bentB @neutral:d4 p:D f:F > @neutral:u2 d:0.15 > @neutral:u8 d:0.15 | stage,stages,step,level,degree | high
STEP | =STAGE | step,steps | high
ARMY | A @chest:u6o4 p:B f:I > @chest:u6o4 ~tap:1.5 | A @chest:d4o6 p:B f:O | army,armies,soldier,soldiers,troops,hosts | low
HAVE | bentB @chest:f10o6 p:B f:U > @chest:f2o6 at:tipM d:0.25 ;sym | have,has,had,possess | high
CONTROL | X @neutral:o6 p:I f:F > @neutral:o6f6 d:0.15 ;alt x2 | control,controller,manage,dominate | high
TALL | 1 @base.palm:o2d4 p:I f:U > @base.palm:o2u10 d:0.3 | B @neutral p:I f:U | tall,lofty,towering | high
ENCOURAGE | B @neutral:o8 p:F f:U > @neutral:o8f8 d:0.15 ;sym x2 | encourage,urge,motivate | high
BIND | curvedB @neutral:o2 p:U f:F > S @neutral:o6 ~twist:30 d:0.3 ;sym | bind,bound,tie,tied | med
PUSH-AWAY | B @neutral:b2 p:F f:U > @far d:0.25 ;sym face:browDown=0.5 | push away,repulse,drive away,repel | high
FOREHEAD | 1 @forehead:f3 p:I f:B at:tipI | forehead,forelock | high
CRUSHER | S @base.palm:u8 p:D f:F > @base.palm:u1 ~twist:30 d:0.25 | B @neutral p:U f:FI | crusher,crushing | med
OPPOSITE | 1 @neutral:o3 p:B f:I > @neutral:o14 d:0.3 ;sym | opposite,oppose,against,contrary | high
HOLD | S @neutral:u2 p:I f:F > @neutral:d1 d:0.2 ;sym | hold,keep,grip | high
BECOME | B @neutral p:B f:I > p:F d:0.3 | B @neutral p:F f:I > p:B d:0.3 | become,became,turn into | high
DIRTY | 5 @chin:d3 p:D f:I ~wiggle:15 | dirty,filthy,foul,pus | high
PULL-OUT | curved5 @neutral:f6 p:B f:U > S @neutral:b4u6 d:0.2 | pull out,extract,snatch | med
GENTLE | B @base.back p:D f:F > @base.back:f6 d:0.3 | B @neutral p:D f:FI | gentle,gently,soft,softly | med
SWIM | B @neutral:f8 p:D f:F > @neutral:o14f4 d:0.25 ;sym x2 | swim,glide,float | high
AHEAD | 10 @neutral:b2o3 p:I f:F > @neutral:f10o3 d:0.3 | 10 @neutral:f4i2 p:I f:F | ahead,precede,forward | high
LOOK-DOWN | V @eyes:f6 p:D f:D > @neutral:f8 d:0.3 ;face:headPitch=0.15 | look down,downcast,lowered | med
ROTTEN | flatO @neutral:o4 p:U f:F > 5 ~wiggle:10 d:0.3 ;sym | rotten,decayed,crumbled,decay | low
SURFACE | B @base.back:u3b6 p:D f:F > @base.back:u3f8 d:0.3 | B @neutral p:D f:FI | surface,face of the earth | med
YOURSELF | 10 @neutral:f12 p:I f:F > @neutral:f16 d:0.12 ;x2 | yourself | high
LESSON | bentB @base.palm:u4 p:D f:I at:ulnar > @base.palm:b6u4 at:ulnar d:0.25 | B @neutral p:U f:FI | lesson,example,warning | med
FROWN | bent5 @eyes:o5f6u3 p:B f:U > @eyes:o5f6 d:0.25 ;sym face:browDown=1,frown=0.8 | frown,frowned,scowl | med
BLIND | bentV @eyes:f2 p:B f:U at:tipI > @eyes:f1 at:tipI d:0.1 | blind | high
ATTENTION | B @temple:f2o3 p:I f:U > @face:f16o6 d:0.3 ;sym | attention,attend,focus | high
HURRY | H @neutral:o6 p:I f:F > @neutral:o6f6 d:0.12 ;sym x2 | hurry,haste,rush,striving | high
IGNORE | 4 @nose:f2 p:I f:U at:radial > @neutral:o14u6 d:0.25 | ignore,neglect,distracted | high
VEGETABLE | V @cheek p:F f:U at:tipI ~twist:40 | vegetable,vegetables,herbage | high
BUSY | B @base.back:u2 p:I f:F at:heel > @base.back:u2o6 at:heel d:0.12 ;x2 | S @neutral p:D f:FI | busy,occupied,preoccupied | high
PREGNANT | 5 @stomach:f4o2 p:B f:I > @stomach:f8o0 d:0.3 ;sym | pregnant | high
GIRL | A @jaw p:I f:U at:tipT > @chin:o3 at:tipT d:0.25 | girl,girls,female child | high
RETREAT | B @neutral:f8 p:F f:U > @neutral:b4 d:0.35 ;sym | retreat,recede,withdraw | med
HORIZON | B @face:i12f14 p:D f:FI > @face:o16f14 d:0.45 | horizon | med
CURSE | claw5 @mouth:f3 p:B f:U > @neutral:u8f14 p:F d:0.2 ;face:browDown=0.7 | curse,cursed,accursed,expelled | med
BURST | S @neutral:o3 p:D f:F > 5 @neutral:o16u6 d:0.15 ;sym face:eyesWide=0.5 | burst,erupt,explode | high
CHEAT | 3 @base.back:b4 p:D f:FI > @base.back:i4 d:0.2 | B @neutral p:D f:FI | cheat,defraud,fraud | med
LESS | B @base.back:u10 p:D f:FI > @base.back:u3 d:0.3 | B @neutral p:D f:FI | less,decrease,reduce,deficient | high
SMELL | B @nose:d2f2 p:B f:U > @nose:u3f4 d:0.15 ;x2 | smell,scent,fragrance | high
MIX | claw5 @neutral:u4 p:D f:F ~circle:U4x2 | claw5 @neutral:d4 p:U f:F | mix,mixed,mixture | high
PASS | 10 @neutral:b4o4 p:I f:F > @neutral:f12o2 d:0.3 | 10 @neutral:f4i2 p:I f:F | pass,passed by,pass by | high
WINK | L @eye:f2 p:I f:U at:tipI > baby0 d:0.1 ;x2 | wink,winked | med
DIG | bentB @base.palm:u2 p:U f:F > @neutral:u8f4 ~arc:f3 d:0.3 ;x2 | B @neutral p:U f:FI | dig,dug,digging | high
PERSECUTE | S @neutral:o4 p:I f:F > @neutral:o4f6 d:0.12 ;alt x2 face:browDown=0.6 | persecute,torture,torment,oppress,afflict | med
SURROUND | 5 @neutral:o4u2 p:I f:F > @neutral:i4 ~arc:f10 d:0.45 | S @neutral:d2 p:D f:F | surround,encompass,encircle | high
PIERCE | 1 @base.palm:b6 p:D f:F > @base.palm:f10 d:0.15 | 5 @neutral p:B f:I | pierce,piercing,penetrating | med
SPURT | flatO @neutral p:D f:F > 5 @far:u4 d:0.12 | spurt,gushing,emitted | med
PLAY | Y @neutral:o6 p:B f:U ~twist:35 ;sym | play,playing,amusement,sport | high
DRY | X @chin:o6 p:D f:I at:radial > @chin:i6 at:radial d:0.25 | dry,dried,withered | high
COVER-ALL | B @aboveHead:f6 p:D f:F > @neutral:u4f10 ~arc:f10 d:0.45 ;sym | overwhelming,cover all,enveloping | med
TIRED | bentB @chestSide p:B f:U at:tipM > @chestSide:d3 p:B f:UO d:0.3 ;sym face:browInnerUp=0.5 | tired,exhausted,weary | high
BOIL | 5 @base.palm:d6 p:U f:F ~wiggle:15 | B @neutral p:D f:FI | boil,boiling,scalding | high
THORN | 1 @base.palm:u6 p:D f:D > @base.palm:u0 d:0.1 ;x2 | B @neutral p:U f:FI | thorn,thorns,thorny,prick | med
READY | R @neutral:o2 p:D f:F > @neutral:o14 d:0.3 ;sym | ready,prepared,set | high
CUT | V @neutral:u2 p:B f:F > U d:0.12 ;x2 | cut,carve,carved | high
LIMIT | bentB @neutral:u8 p:D f:FI > @neutral:u6 d:0.15 | bentB @neutral:d2 p:D f:FO > @neutral:u0 d:0.15 | limit,restrict,restricted,bound | high
SHAME | bentB @cheek:d2 p:B f:U at:knuckles > @cheek:u2 at:knuckles d:0.3 ;sym face:browInnerUp=0.6,frown=0.3 | shame,humiliate,disgrace,embarrass | high
INHERIT | 5 @shoulder:f6 p:B f:U > @neutral:f12d2 ~arc:u4 d:0.4 ;sym | inherit,inheritance | med
GREEDY | claw5 @far p:U f:F > S @chest:f4 d:0.3 ;face:browDown=0.4,squint=0.4 | greedy,greed,devour | med
FREE | F @neutral:i3 p:B f:U > @neutral:o12 p:F d:0.3 ;sym | free,freedom,release,liberate | high
LEFT | L @neutral:o2 p:F f:U > @neutral:i10 d:0.3 | left,left side,companions of the left | high
RIGHT-SIDE | R @neutral:o2 p:F f:U > @neutral:o14 d:0.3 | right side,right hand,companions of the right | high
QUIET | B @lips:o3f2 p:I f:U > @neutral:o12 p:D f:F d:0.4 ;sym | quiet,still,calm,silent | high
OPPRESS | B @base.back:u8 p:D f:FI > @base.back:u1 d:0.3 | 10 @neutral p:I f:F | oppress,oppressed,mistreat,harsh | med
DRAG | curved5 @far:u4 p:D f:F > S @neutral:b4 d:0.35 ;sym | drag,dragged,seize | high
HAIR | F @temple:u4 p:I f:U at:tipI > @temple:u4 ~shake:1 h:0.3 | hair,forelock | high
DIVIDE | B @neutral:u4 p:I f:F at:ulnar > @neutral:o14d2 p:D d:0.3 ;sym | divide,divided,split up,separate | high
SINCERE | H @base.palm:b4 p:D f:F > @base.palm:f6 d:0.25 | B @neutral p:U f:FI | sincere,sincerity,honest,devoted | med
SPARK | flatO @neutral:o2 p:D f:F > 5 d:0.1 ;sym x2 | spark,sparks | med
HOOF | S @neutral:o4 p:D f:F > @neutral:o4d3 d:0.1 ;alt x2 | hoof,hooves,strike sparks | low
ATTACK | S @neutral:o10f2 p:I f:FI > @neutral:i2f12 d:0.2 ;face:browDown=0.6 | attack,raid,charge | med
MIDDLE | bentB @base.palm:u3 p:D f:F ~circle:U3x1 > @base.palm:u1 d:0.12 | B @neutral p:U f:FI | middle,center,midst | high
FLUFFY | claw5 @neutral:o6 p:U f:F > @neutral:o6u3 ~wiggle:10 d:0.3 ;sym | fluffy,soft,carded | med
DISTRACT | B @temple:o4 p:I f:U > @temple:o14f8 d:0.25 | distract,divert,preoccupy | med
VISIT | V @neutral:o6u6 p:B f:U ~circle:I4x2 ;sym | visit | high
GOSSIP | G @neutral:o6u4 p:D f:F > baby0 d:0.1 ;sym x3 | gossip,backbite,slander,slanderer | high
REACH | 5 @neutral p:D f:F > S @far:u4 d:0.3 | reach,reached,attain | high
COLUMN | C @low:o4 p:I f:F > @high:o4 d:0.4 ;sym | column,columns,pillar,pillars | med
TRAVEL | bentV @neutral:o4u2 p:D f:F ~circle:I5x1 > @far:o6 d:0.3 | travel,journey,caravan | high
SHOW-OFF | 10 @hip:f8 p:I f:F > @hip:f4 d:0.12 ;sym x2 | show off,show-off,boast,make show | high
REFUSE | 10 @neutral:u4 p:I f:F > @shoulder:u6b2 d:0.25 ;face:shake=0.1,browDown=0.5 | refuse,refused,withhold,deny help | high
SACRIFICE | B @neutral p:U f:F > @high:u4 d:0.3 ;sym | sacrifice,offering,slaughter | low
CUT-OFF | B @base.tipM:u4 p:I f:F at:ulnar > @base.tipM:d6 at:ulnar d:0.15 | B @neutral p:D f:FI | cut off,cut short,without posterity | med
ACCEPT | 5 @far:o6 p:D f:F > flatO @chest:f3o4 d:0.35 ;sym | accept,accepting,receive | high
BORN | B @stomach:f4 p:B f:I > @neutral:d4f12 p:U f:F d:0.35 | B @neutral:d4 p:U f:FI | born,birth,give birth,begotten | high
KNOT | X @neutral:o2 p:I f:F ~circle:B3x1 > @neutral:o8 d:0.15 ;sym | knot,knots | med
EXCEED | bentB @base.back:u3 p:D f:FI > @high:u4 ~arc:f4 d:0.4 | bentB @neutral:u4 p:D f:FO | exceed,excess,beyond limit,overstep | high

# ---------- batch 2: frequent words across the whole Qur'an ----------
CAUSE | =MAKE | cause,causes,caused,causing | med
WRONGDOER | =EVIL+PERSON | wrongdoer,wrongdoers,criminal,criminals,corrupter,corrupters,evildoer,evildoers,doer of wrong | med
TAKEN | =TAKE | taken | high
SHIRK | =WORSHIP+OTHER+GOD | associate,associates,associated,associating,shirk,partners,partner,'partners' | low | associating partners with Allah
POLYTHEIST | =WORSHIP+OTHER+GOD+PERSON | polytheist,polytheists,mushrik,mushrikun | low
BESIDES | =OTHER | besides,other than,apart from | med
TRUTHFUL | =TRUE | truthful,sincere,truly | high
PROVIDE | =GIVE | provide,provided,provides,sustain,sustained,provision | med
SEEK | C @face:o4f10 p:I f:U ~circle:F5x2 | seek,seeking,sought,look for,search | high
BENEFIT | F @chestSide:u4 p:B f:U at:tipI > @chestSide:d2 at:tipI d:0.2 | benefit,benefits,beneficial,profit,useful | med
BLAME | 10 @base.back:u2 p:D f:F > @far:u4 d:0.25 | 10 @neutral p:D f:FI | blame,blamed,blameworthy,accuse | high
WRETCHED | =EVIL | wretched,miserable | med
PROTECTOR | =PROTECT+PERSON | protector,guardian,ally,allies,wali,patron | med
TERM | =TIME | term,period,appointed term | med
MESSAGE | =NEWS | message,messages | med
AUTHORITY | =POWER | authority,competent,able to do | med
KNOWN | =KNOW | known,knows | high
UNJUST | =NOT+EQUAL | unjust,injustice,unjustly,unfair,wrong,wronged,wronging | med
ANYONE | =SOMETHING | anyone,anybody,everyone else | low
COMMIT | =DO | commit,committed,commits,doers,practice | med
DURING | 1 @neutral:o6 p:D f:F > @far:o6 d:0.4 ;sym | during,while,meanwhile | high
GOAL | 1 @temple p:B f:IU at:tipI > @base.tipI at:tipI d:0.4 | 1 @high:f20 p:B f:U | goal,destination,aim,purpose | high
APPOINT | =DECIDE | specified,appointed,appointment,determined | med
WHEREIN | =IN | wherein,therein | med
VISION | =SEE | vision,sight,perceive,perceived | med
GENERATION | 5 @shoulder:f6 p:B f:U > @neutral:f14d6 ~arc:u4 d:0.45 ;sym | generation,generations,descendants,offspring,progeny | high
PAYMENT | =PAY | payment,compensation,ransom,price | med
ACCORDING | =FOLLOW | according,in accordance | low
INSTEAD | =CHANGE | instead,in place of,replace,substitute | med
WHEREVER | =WHERE | wherever | med
SHARE | B @base.radial:u2 p:I f:F at:ulnar > @base.radial:u2o8 at:ulnar d:0.15 ;x2 | B @neutral p:U f:FI | share,portion,lot | high
DOMINION | =KING+ALL | dominion,kingdom,sovereignty,mulk | med
SUBJECT | =CONTROL | subjected,subjugate,made subservient | med
RESIDENCE | =HOME | residence,settlement,dwelling,abode | med
PRODUCE | =MAKE | produce,produced,brought forth | med
POSSESSOR | =OWN | possessor,possessors,owner | med
CHOSEN | =CHOOSE | chosen,chose,selected | high
INTEND | =WANT | intend,intended,intends,intention | med
PLACE | flatO @neutral:o6 p:D f:F > @neutral:o6d3 d:0.15 | place,position,location,station | med
WAR | 4 @neutral:o8 p:B f:I > @neutral:i4 d:0.25 > @neutral:o8 d:0.25 ;sym | war,battle,fighting,combat | high
SICK | open8 @temple p:B f:IU at:tipM | open8 @stomach p:B f:U at:tipM | ill,sick,sickness,disease,illness | high
TOUCH | open8 @base.back:u4 p:D f:F at:tipM > @base.back:u0 at:tipM d:0.15 | B @neutral p:D f:FI | touch,touched,touches,afflicted | high
DEFEAT | S @neutral:u6 p:D f:F > @neutral:u0 d:0.25 | S @neutral:d2 p:I f:F | defeat,overcome,overpower,conquer,prevail,victorious | high
STATEMENT | =SAY | statement,saying,speech,claim,claimed,claims | med
AVERT | =PREVENT | avert,averted,turn away from | med
UNAWARE | =NOT-KNOW | unaware,heedless,ignorant | med
USE | U @base.back:u2 p:D f:F ~circle:F4x2 | S @neutral p:D f:FI | use,used,utilize | high
INVENT | 4 @forehead:o2 p:I f:U at:radial > @forehead:o2u10 at:radial d:0.3 | invent,invented,invents,fabricate,fabricated,devise | high
DENIER | =DENY+PERSON | denier,deniers,rejecter,rejecters | med
EXCHANGE | F @neutral:o6 p:I f:F > @neutral:o6f8 ~arc:u6 d:0.35 | F @neutral:o6f8 p:I f:F > @neutral:o6 ~arc:d6 d:0.35 | exchange,trade,barter,purchase,buy,sell,sold | med
FULFILL | =KEEP | fulfill,fulfilled,fulfil,observe | med
IMMORALITY | =SIN | immorality,indecency,misdeeds,misdeed,lewdness | med
AVAIL | =HELP | avail,availed | med
EXCELLENT | =GREAT | excellent,splendid | med
EMINENT | =HONOR | eminent,distinguished,exalted in might | med
CONFIRM | =PROVE | confirm,confirming,confirmation,verify | med
DROWN | V @base.palm:u4 p:B f:D > @base.palm:d10 d:0.4 | 5 @neutral p:D f:FI | drown,drowned,sink,sank | high
UNLESS | =ONLY | unless,except | med
WORTHLESS | =NONE | worthless,useless,vain | low
FOOT | 1 @neutral:f10 p:B f:D > @low:f10 d:0.3 | foot,feet | med
COURSE | =PATH | course,orbit | med
LETTERS | =fs:ALM | | low
MASJID-HARAM | =HOLY+MOSQUE | al-masjid al-haram,sacred mosque | low
ADORNMENT | =BEAUTIFUL | adornment,adorned,decoration,embellish | med
UNGRATEFUL | =NOT+THANK | ungrateful,ingrate,ingratitude | high
ALMOST | curvedB @base.back:f2 p:U f:F > @base.back:f6u8 d:0.2 | curvedB @neutral p:D f:F | almost,nearly | high
COMMUNITY | =GROUP | community,faction,nation,ummah,party | med
RETRIBUTION | =PUNISH | retribution,requital,vengeance | med
BOY | flatO @forehead:u2 p:D f:F > @forehead:u2 d:0.1 ;x2 | boy,boys,young man,youth | high
MISLEAD | =DECEIVE | mislead,misled,misguide | med
ADVERSITY | =SUFFER | adversity,affliction,hardship,calamity,distress | med
SPOUSE | =MARRY | mates,mate,spouse,spouses | med
DEAF | 1 @ear:f2 p:F f:IU at:tipI > @mouth:o3 p:B f:IU at:tipI d:0.3 | deaf | high
SUDDENLY | =SURPRISE | suddenly,unexpectedly,sudden | med
EFFECT | =LAST | effect,outcome | low
AROUND | =SURROUND | around | med
IGNORANT | V @forehead:f2 p:B f:U at:back > @forehead:f1 at:back d:0.1 | ignorant,ignorance,jahiliyyah | high
GUARDIAN | =PROTECT+PERSON | guardian,keeper,custodian | med
TREATY | =PROMISE | treaty,covenant,pledge,agreement | med
EXTEND | =GIVE | extend,extends,stretch | low
THEREAFTER | =AFTER | thereafter,afterwards,later on | high
FEARFUL | =AFRAID | fearful,frightened,terrified | high
AWFUL | 8 @temple:f2 p:F f:U > 5 @temple:o6f6 d:0.15 ;sym face:browDown=0.5,frown=0.6 | terrible,awful,dreadful,horrible,grievous | high
CONDITION | =THING | condition,state,situation | low
HUMILIATE | =SHAME | humiliation,humiliated,disgraced,abased | med
DETERMINE | =DECIDE | determination,determined,resolve | med
FACT | =TRUE | fact,reality | med
EXTREME | =VERY | extreme,extremely | low
DISOBEDIENCE | =DISOBEY | disobedience,rebellion | high
CROP | =PLANT | crops,crop,harvest,tilth | med
EXPLAIN-DETAIL | =EXPLAIN | interpretation,detail,detailed,describe,description | med
OBVIOUS | =CLEAR | obvious,apparent,manifest,evident | high
INTERCEDE | =ASK+FOR | intercession,intercede,intercessor | low
COW | Y @temple p:F f:U at:tipT ~twist:30 | cow,cows,calf,heifer,cattle | high
MOUNT | =MOUNTAIN | mount | low
PREVIOUS | =BEFORE | previous,preceding,earlier | high
FOOTSTEPS | =FOLLOW | footsteps | low
STOMACH | 1 @stomach:f3 p:I f:B at:tipI | stomach,belly,bellies,womb,wombs | high
HEAD | bentB @temple:u2 p:I f:BU at:tipM > @jaw at:tipM d:0.25 | head,heads | high
EMIGRATE | =LEAVE+MOVE | emigrated,emigrate,emigrants,hijrah | low
LOAN | V @nose:f2 p:I f:U at:tipI > @neutral:f12 d:0.3 | loan,lend,lent,borrow | med
TRUSTWORTHY | =TRUST | trustworthy,faithful,reliable | med
PERMITTED | =ALLOW | permitted,lawful,halal | med
SUPPLICATE | =DUA | supplicate,supplicated,invoke,call upon | med
EVERYONE | =EVERY+ONE | everyone,everybody,each one | high
PERPETUAL | =FOREVER | perpetual,endless,lasting,permanent | high
SUPPORT | S @base.radial:d4 p:I f:F > @base.radial:u2 d:0.3 | S @neutral p:I f:F | support,supporter,supporters,helpers | high
ABUNDANCE | =MANY | abundance,abundant,plenty | med
HUMBLY | =HUMBLE | humbly | med
DEVOUT | =WORSHIP | devoutly,devout,devotion | low
DISSENSION | =FIGHT | dissension,argument,argue,quarrel | med
DISASSOCIATE | =LEAVE | disassociated,disown,dissociate | low
BEHAVIOR | =DO | conduct,behavior,behaviour | med
QUICK | 10 @neutral:u4 p:I f:F > 1 @neutral:u4f2 d:0.08 | swift,quick,quickly,fast,soon,hasten | high
DIVORCE | D @neutral:o2 p:F f:U > @neutral:o14 p:B d:0.3 ;sym | divorce,divorced | high
OBLIGATION | =MUST | obligation,obligatory,duty,prescribed,decreed | med
BARREN | =NOT+CHILD | barren,infertile | low
THROUGH | B @base.radial:o4 p:I f:F at:ulnar > @base.radial:i8 at:ulnar d:0.3 | V @neutral p:I f:F | through,throughout,via,by means of | med
AWAY | =LEAVE | away | low
ATTAINMENT | =WIN | attainment,achievement,triumph | med
CALF | =COW | calf | med
EXISTENCE | =LIFE | existence,being,beings | low

# ---------- batch 3: Surahs 69-77 ----------
SHADE | B @aboveHead:f8 p:D f:F > @high:f12 d:0.3 | B @neutral:u6 p:D f:FI | shade,shadow,shelter | med
DEAD | =DIE | dead,lifeless | high
DEATH | =DIE | death | high
GUARD | =PROTECT | guard,guards,guardian,watcher | high
EXCUSE | =FORGIVE | excuse,excuses,pardon | med
SILK | flatO @base.back:u2 p:D f:F > @base.back:u2f6 ~wiggle:6 d:0.3 | B @neutral p:D f:FI | silk,brocade,satin,fine cloth | low
SINNER | =SIN+PERSON | sinner,sinners | med
SKIN | baby0 @cheek p:B f:U at:tipI > @cheek:o1 ~shake:1 h:0.25 | skin,skins,hide | high
EAST | E @neutral:o2 p:F f:U > @neutral:o14 d:0.3 | east | high
WEST | W @neutral:o2 p:F f:U > @neutral:i10 d:0.3 | west | high
DELAY | F @neutral:b4 p:I f:F > @far:u2 ~arc:u4 d:0.4 ;sym | delay,postpone,defer,respite | high
FINGER | 1 @base.tipI:o3 p:I f:FI at:tipI > @base.tipI:o1 at:tipI d:0.1 | 1 @neutral p:B f:U | finger,fingers,fingertip,fingertips | med
REFUGE | =PROTECT | refuge,sanctuary,haven | med
NUMBER | flatO @neutral:o2u2 p:B f:FI > @neutral:o2u2 p:F f:FO d:0.2 ;x2 | flatO @neutral:o2 p:F f:FI > @neutral:o2 p:B f:FO d:0.2 | number,numbers,count | high
THIRD | 3 @neutral:u6 p:B f:U > @neutral:d2 d:0.25 | third,thirds | med
AGAINST | 1 @base.palm:o12 p:I f:FI > @base.palm:o1 at:tipI d:0.2 | B @neutral p:I f:U | against,versus | high
LEG | B @hip:f10 p:B f:D at:ulnar > @hip:f10 ~tap:2 | leg,legs,shin | med
NOTHING | =NONE | nothing,naught | high
GLASS | X @mouth:o2 p:B f:U at:knuckles > @mouth:o2 ~tap:1 | glass,crystal | med
HUGE | =BIG | huge,enormous,mighty blast | high
ANY | A @neutral:u4 p:B f:U > @neutral:u4 p:F ~twist:20 | any | med
REMAIN | =STAY | remain,remains,remnant,survivor | high
OVERTURN | B @neutral:u4 p:D f:F > @neutral:u4 p:U d:0.3 ;sym | overturn,overturned,upside down,overthrown | med
LIFT | =RAISE | lift,lifted,carried up | high
EDGE | B @base.radial:u2 p:D f:F at:ulnar > @base.radial:u2f8 at:ulnar d:0.25 | B @neutral p:D f:FI | edge,edges,border,side | med
GONE | 5 @far:o4 p:B f:F > flatO @far:o4f6 d:0.3 | gone,vanished,lost | high
ARM | B @base.wrist:b4 p:D f:F > @base.wrist:b20 d:0.3 | B @neutral p:D f:FI | arm,arms,cubit,cubits | med
WASH | A @base.palm:u2 p:D f:F ~circle:U4x2 | B @neutral p:U f:FI | wash,washing,discharge | high
FORTUNE-TELLER | =PREDICT+PERSON | soothsayer,fortune teller,fortune-teller,diviner | med
VEIN | 1 @neck:o3 p:B f:U at:tipI > @neck:o3d4 at:tipI d:0.2 | vein,aorta,artery,jugular | low
STAIRS | bentB @neutral:d4o6 p:D f:F > @neutral:u4o2 d:0.15 > @high:i2 d:0.15 | stairs,stairways,ladder,ascent | med
GO-UP | 1 @neutral p:F f:U > @aboveHead:o4 d:0.4 | ascend,go up,rise up,ascending | high
METAL | X @chin:d2 p:B f:I at:knuckles > @chin:d2 ~tap:1.5 | metal,brass,copper,iron | med
MELT | flatO @neutral:o2 p:U f:F > 5 @neutral:o12d4 d:0.4 ;sym | melt,melted,molten,dissolve | high
TEAR | F @neutral:o2 p:F f:U > @neutral:o14d2 p:D d:0.2 ;sym | tear,torn,rip,strip | high
IMPATIENT | =NOT+PATIENT | impatient,anxious,fretful | high
PRIVATE | A @lips p:I f:U at:tipT > @lips:f3 at:tipT d:0.1 ;x2 | private,private parts,chastity,modesty | low
TESTIFY | =WITNESS | testify,testimony,bear witness | high
PLEASURE | =ENJOY | pleasure,delight,bliss,blessing | high
LOUD | 5 @ear:o4f2 p:B f:U > @neutral:o14u6f10 ~shake:1 d:0.3 ;sym | loud,loudly,publicly,aloud | high
LAYER | B @base.back:u2 p:D f:F > @base.back:u6 d:0.15 > @base.back:u10 d:0.15 | B @neutral p:D f:FI | layer,layers,levels,one above another | med
LAMP | =LIGHT | lamp,torch,burning lamp | med
WIDE | B @neutral:o4 p:I f:F > @neutral:o20 d:0.35 ;sym | wide,broad,spacious | high
WONDERFUL | =GREAT | wonderful,amazing,wondrous | high
ARROGANT | =PROUD | arrogant,arrogance,insolent,haughty | med
SHOOT | 1 @neutral:u4o4 p:I f:F > @far:u10 d:0.15 | shoot,shooting,meteor,flame shooting | med
CROWD | 5 @far:o8 p:D f:F > @neutral:o2 d:0.4 ;sym | crowd,crowded,throng,swarm | high
HARM | =PAIN | harm,hurt,damage | med
FRONT | B @neutral:f6 p:B f:U > @neutral:f16 d:0.25 | front,before him,in front | high
SLOW | B @base.back:b4 p:D f:F > @base.back:f8 d:0.6 | B @neutral p:D f:FI | slow,slowly,measured,careful | high
DEVOTE | =WORSHIP | devote,devotion,dedicate | med
CHOKE | C @neck:f2 p:B f:U > S @neck:f1 d:0.25 ;face:eyesWide=0.5 | choke,choking | high
SAND | flatO @base.palm:u2 p:D f:F ~wiggle:12 | B @neutral p:U f:FI | sand,dune,heap of sand | med
IDOL | =FALSE-GOD | idol,idols,statue,uncleanliness | med
STUBBORN | B @temple:u2 p:F f:UO at:radial > bentB d:0.15 | stubborn,obstinate,defiant,defiantly | high
CLIMB | bentV @base.palm:d4 p:F f:U > @base.palm:u6 d:0.2 > @base.palm:u12 d:0.2 | B @neutral:i4 p:I f:U | climb,climbing,ascend steep | high
IT | =IX-a | it | high
ITS | =POSS-a | its | high
MEAN | V @base.palm:u4 p:D f:D > @base.palm:u4 p:D f:D ~twist:40 | B @neutral p:U f:FI | mean,meaning,intend,purpose | high
EXAMPLE | =SHOW | example,parable,similitude | high
GO-AHEAD | =AHEAD | go ahead,advance,progress | high
DESERVE | flatO @base.palm:u4 p:U f:F > @base.palm:u1 d:0.12 ;x2 | B @neutral p:U f:FI | deserve,deserving,worthy,entitled | low
TIP | 1 @base.tipI:u3 p:D f:D at:tipI > @base.tipI:u1 at:tipI d:0.1 | 1 @neutral p:B f:U | tip,tips,end | med
SHOCK | 5 @eyes:f6 p:B f:U > claw5 @eyes:f10 d:0.1 ;face:eyesWide=1,browUp=1,mouthOpen=0.4 | shock,shocked,dazzled,stunned,terror | high
JOIN | F @neutral:o10 p:I f:F > @neutral:o2 d:0.3 ;sym | join,joined,unite,connect | high
THROAT | G @neck:f2 p:B f:U at:tipI > @neck:d3f2 at:tipI d:0.2 | throat,collarbone,collar bones | high
HEAL | =HELP | heal,cure,healer,curer | low
DRIVE | S @neutral:o8u2 p:I f:F > @neutral:o8d2 d:0.2 ;alt x2 | drive,driven,herd,urge on | med
MENTION | =SAY | mention,mentioned,thing worth mentioning | high
RING | X @base.tipR:u2 p:D f:F ~circle:B2x1 | B @neutral p:D f:FI | ring,collar,iron collars,neck ring | low
PRISONER | 4 @face:f4 p:B f:I | 4 @face:f8 p:B f:I | prisoner,captive,captives,prison,jail | med
PERFECT | 9 @neutral:u4o6 p:I f:F > @neutral:u4o2 at:tipI d:0.25 | 9 @neutral:u2o2 p:I f:F | perfect,precise,exact | high
YOUNG | bentB @chestSide:d2 p:B f:U at:tipM > @chestSide:u2 at:tipM d:0.15 ;sym x2 | young,youth,youthful | high
PEARL | =fs:PEARL | pearl,pearls | low
KINGDOM | =KING+ALL | kingdom,great dominion | med
WEAR | =CLOTHES | wear,wearing,clothed,adorned with | med
BRACELET | 1 @base.wrist:u2 p:D f:FI at:tipI ~circle:I3x1 | S @neutral p:D f:FI | bracelet,bracelets | med
STORM | =WIND | storm,gale,raging | med

SEPARATE | B @neutral:o2 p:B f:F at:back > @neutral:o14 d:0.3 ;sym | separate,separating,distinguish,sort | high
FRESH | =NEW | fresh,sweet water | low
BRANCH | 5 @base.tipI:u2 p:F f:U > @base.tipI:u2o10 ~arc:u4 d:0.3 | 1 @neutral:u4 p:B f:U | branch,branches,column of smoke | low
COOL | 5 @face:o8f6 p:B f:U > @face:o8f6 ~wiggle:10 h:0.4 ;sym | cool,coolness,cooling | high
UNQUESTIONABLY | =TRUE | unquestionably,undoubtedly,no doubt,certainly | med
ACCEPTABLE | =ACCEPT | acceptable,approval,approved,accepted | med
FULLY | =ALL | fully,completely,in full | med
ASSUMPTION | =THINK | assumption,assume,conjecture,guess | med
MARRIAGE | =MARRY | marriage,wedding | high
NOTIFICATION | =NEWS | notification,proclamation,declaration | med
FALLEN | =FALL | fallen | high
BEYOND | =EXCEED | beyond | med
STAFF | S @neutral:u6 p:I f:F | S @neutral:d4 p:I f:F | staff,rod,stick | med
REPRIEVE | =DELAY | reprieved,reprieve,respited | med
OFFER | B @neutral:b2 p:U f:F > @neutral:f8u4 d:0.3 ;sym | offer,present,proposal | high
GRAZE | =EAT | grazing,graze,pasture | low
OCCUR | =HAPPEN | occurred,occurs,befall,befell | high
AFFECTION | =LOVE | affection,compassion,tenderness | med
CONVERSATION | =TALK | conversation,private conversation,dialogue | med
DESPAIR | =SAD+LOSE | despair,despairing,hopeless | med
SWALLOW | 1 @chin:f4 p:B f:U at:tipI > @neck:d4 at:tipI d:0.3 | swallow,swallowed,gulp | high
ABUSE | =OPPRESS | abuse,aggression,transgress against | med
FORGOTTEN | =FORGET | forgotten | high
FLESH | =BODY | flesh,meat | low
BEQUEST | =GIVE | bequest,will | low
DISTINCT | =DIFFERENT | distinct,distinguished,distinction | med
EXPEL | =PUSH-AWAY | expel,expelled,evict,drive out | med
FITNAH | =TEST | fitnah,trial,temptation,persecution | low
ANIMOSITY | =HATE | animosity,enmity,hostility | med
BEWARE | =WARN | beware,caution | high
DOUBLE | V @neutral:u4 p:B f:U > p:F d:0.25 | double,twofold,multiply | high
DEBT | 1 @base.palm:u2 p:D f:D at:tipI > @base.palm:u0 at:tipI d:0.12 ;x2 | B @neutral p:U f:FI | debt,owe,debtor | high
MATURITY | =GROW+FINISH | maturity,full strength,adulthood | med
UNTRUTH | =LIE | untruth,falsehood,lying | high
INCLINE | =WANT | incline,inclination,inclinations,inclining,leaning | low
DISLIKE | =NOT+LIKE | dislike,disliked,hate | high
DESIST | =STOP | desist,cease,refrain | high
LAW | L @base.palm:u4 p:I f:U at:radial > @base.palm:d4 at:radial d:0.25 | B @neutral p:I f:U | law,laws,legal,legislation,ruling | high
CONVEY | =SEND | conveyed,convey,deliver,notify | med
ENVELOP | =COVER | enveloped,envelop,overwhelmed | med
AFTERNOON | B @neutral:u6o4 p:D f:FO > @neutral:u2o8 d:0.3 | B @neutral:d4 p:D f:FI | afternoon,asr | high
SUCCESSOR | =FOLLOW+PERSON | successors,successor,vicegerent,khalifah | med
RELATE | =STORY | relate,recount,narrate | med
BEGIN | =START | began,begin,beginning,originate | high
WONDER | 1 @temple p:B f:IU at:tipI ~circle:B3x2 | wonder,wondered,marvel | high
SETTLED | =STAY | settled,settle,establishment,established | med
IMMEDIATELY | =QUICK | immediately,instantly,at once | med
SPERM | =SEED | sperm,sperm-drop,drop,fluid | med
MERELY | =ONLY | merely,simply | high

# ---------- batch 4: Juz 29 (67-68) ----------
US | =WE | us | high
WARNER | =WARN+PERSON | warner,warners | high
WING | B @shoulder:o4f4 p:F f:O > @shoulder:o12u6 p:D d:0.2 ;sym x2 | wing,wings | med
SOFT | curved5 @neutral:o6 p:U f:F > flatO @neutral:o6d2 d:0.15 ;sym x2 | soft,compromise,lenient,yield | high
HARVEST | curvedB @base.wrist:o8 p:I f:U > S @base.wrist:o2 d:0.25 | 5 @neutral:u4 p:I f:U | harvest,reap,pluck | med
EARLY | open8 @base.back:u2 p:D f:F at:tipM > @base.back:u2 at:tipM ~tap:1 | S @neutral p:D f:FI | early,at dawn,early morning | high
PARTNER | =OTHER+GOD | partner,partners,associates | low
CRACK | 1 @neutral:u8 p:B f:F > @neutral:d4o4 ~arc:o3 d:0.3 | crack,flaw,rift,breach | med
DECORATE | flatO @neutral:o4u4 p:D f:F > @neutral:o4u4 ~circle:F5x1 ;sym | decorate,decorated,adorn,beautified | med
DESTINATION | =GOAL | destination,end,journey's end | high
ADMIT | B @chest:u2 p:B f:I > @neutral:f12 p:U f:F d:0.3 ;sym | admit,confess,acknowledge | high
CHARACTER | C @heart p:I f:U ~circle:B4x1 | character,manners,morals,nature | high
CRUEL | 1 @chin:o4 p:D f:I at:radial > @chin:i4 at:radial ~shake:1 d:0.3 ;face:browDown=0.6 | cruel,harsh,violent,brutal | med
ILLEGITIMATE | =NOT+TRUE+FAMILY | illegitimate,base-born | low
MARK | 1 @base.palm:u2 p:D f:D at:tipI > @base.palm:u2o4 ~arc:d1 d:0.3 | B @neutral p:U f:FI | mark,brand,sign | med
NOSE | 1 @nose:f3 p:I f:B at:tipI | nose,snout | high
TURN | 1 @neutral:u4 p:D f:F ~circle:U4x1 | turn,turned,turning | med
BIGGER | =BIG+MORE | bigger,greater,larger | high
STUDY | 5 @base.palm:u8 p:D f:D ~wiggle:15 | B @neutral p:U f:FI | study,studied,learn from | high
WHATEVER | =ANY+THING | whatever | med
SHIN | B @hip:f12d10 p:B f:D at:ulnar > @hip:f12d10 ~tap:1 | shin,shank,leg uncovered | low
HEALTHY | 5 @chest:o6 p:B f:U > S @chest:o6f6 d:0.25 ;sym | healthy,health,sound,well | high
DISTRESS | =WORRY | distress,anguish,grief | med
SHORE | =EDGE+SEA | shore,coast,bank,open shore | low
TRIP | V @base.palm:u2 p:B f:D > @base.palm:f8 p:U f:F ~arc:u3 d:0.3 | B @neutral p:U f:FI | trip,stumble,slip,make slip | med

# ---------- batch 5: Baqarah 255/284-286, Ya-Sin ----------
WALL | B @neutral:o2u6 p:F f:U > @neutral:o16u6 d:0.35 ;sym | wall,walls,barrier | high
LUCK | 3 @temple:o2 p:F f:U at:tipM > @temple:o2u2 ~twist:20 h:0.2 | luck,omen,bad omen,lucky | low
RIDE | bentV @base.radial:u3 p:D f:F at:tipI > @far:o4 d:0.4 | C @neutral p:I f:F > @far:i2 d:0.4 | ride,riding,mount | high
ARGUE | 1 @neutral:o8u2 p:B f:I > @neutral:o4u2 d:0.12 ;alt x3 face:browDown=0.5 | argue,argument,dispute,disputant,adversary | high
EXIST | =LIFE | exist,existence,sustainer,qayyum | low
KNOWLEDGE | =KNOW | knowledge,learning,ilm | high
MISTAKE | =WRONG | mistake,error,err | high
PARDON | =FORGIVE | pardon,pardoned,overlook | high
AWARE | =KNOW | aware,heedful | high
CHIN | 1 @chin:f3 p:I f:B at:tipI | chin,chins | high
BOTH | V @neutral:u2 p:B f:U > U @neutral:d4 d:0.3 | C @neutral:d2 p:B f:I | both,the two | high
STRENGTHEN | =POWER+MORE | strengthen,reinforce,support | med
ANYTHING | =SOMETHING | anything | high
PALM | =fs:PALM | palm | low
CATCH | 5 @neutral:o12u4 p:I f:F > S @neutral:o4 d:0.2 | catch,overtake,reach | high
ORBIT | 1 @base.back:u5 p:D f:F ~circle:U8x1 | S @neutral p:D f:FI | orbit,course,circuit | med
WHILE | =DURING | while,whilst | high
RUSH | =HURRY | rush,hasten,rushing | high
FORWARD | =AHEAD | forward,onward | high
REVERSE | =OVERTURN | reverse,reversed,invert | med
POETRY | P @neutral:o8u6 p:D f:F ~circle:B4x2 | poetry,poem,poems | med
FITTING | =RIGHT | fitting,befitting,proper,appropriate | med

# ---------- batch 6: Ar-Rahman, Al-Waqi'ah ----------
CORAL | =fs:CORAL | coral,corals,marjan | low
WELCOME | B @neutral:o14f10 p:U f:F > @neutral:o4f2 ~arc:d3 d:0.35 | welcome,hospitality,accommodation | high
EXACT | =PERFECT | exact,precise,calculated | high
FAIR | =EQUAL | fair,just,justice,equity | high
POT | C @neutral:o6 p:I f:F > @neutral:o6d8 ~arc:o3 d:0.35 ;sym | pot,pottery,clay vessel | med
BARRIER | =WALL | barrier,partition | high
SAIL | =SHIP | sail,sailing,ships | med
ATTEND | =ATTENTION | attend to,deal with | low
OIL | F @base.ulnar:d2 p:B f:F at:tipI > @base.ulnar:d6 at:tipI d:0.15 ;x2 | B @neutral p:B f:FI | oil,murky oil | med
RUBY | =RED+STONE | ruby,rubies | low
POMEGRANATE | =fs:POMEGRANATE | pomegranate,pomegranates | low
TENT | V @neutral:u10 p:F f:U > @neutral:o14d2 p:F d:0.35 ;sym | tent,tents,pavilion,pavilions | med
EVENT | =HAPPEN | event,occurrence,inevitable | high
LOWER | =DOWN | lower,bring low | high
JUG | Y @neutral:u4o4 p:I f:U > p:D d:0.3 | jug,jugs,ewer,pitcher | low
HEADACHE | 1 @forehead:o4f4 p:B f:I > @forehead:o4f4 ~twist:30 ;sym face:browInnerUp=0.5 | headache,headaches | high
DRUNK | Y @chin:o2 p:I f:U at:tipT > @chin:i4 at:tipT ~arc:u2 d:0.3 | drunk,intoxicated,intoxication | high
MEAT | F @base.radial:u2 p:B f:I at:tipI > @base.radial:u2 ~shake:1 h:0.3 | B @neutral p:B f:FI | meat,flesh | high
BANANA | 1 @neutral:u6 p:B f:U | flatO @base.tipI:u2 p:D f:D > @base.tipI:d6 d:0.25 | banana,banana trees,talh | low
VIRGIN | =PURE | virgin,virgins | low
FILL | =FULL | fill,filled,filling | high
SALTY | V @base.back:u2 p:D f:F > @base.back:u2 ~tap:1 | V @neutral p:D f:FI | salty,salt,bitter | med
TRAVELER | =TRAVEL+PERSON | traveler,traveller,travelers,wayfarer | high
BY | =WITH | by | low

# ---------- batch 7: Juz 28 ----------
OPPOSE | =OPPOSITE | oppose,opposed,opposition,defy | high
SHE | =IX-a | she | high
THAN | curvedB @neutral:o8 p:I f:U > @neutral:o8u3 d:0.15 ;alt x2 | than,compare,compared | med
TRADE | =EXCHANGE | trade,commerce,business,merchandise | high
WAITING | =WAIT | waiting,waiting period,iddah | med
ROOM | B @neutral:o8 p:I f:F > @neutral:o8 p:B f:I d:0.3 ;sym | room,space,make room,spacious | high
LIAR | =LIE+PERSON | liar,liars | high
SEEN | =SEE | seen,witnessed,visible | high
STRIVE | =TRY | strive,striving,struggle,jihad | med
HELPER | =HELP+PERSON | helper,helpers,supporter,ansar | high
GREET | =SALAM | greet,greeting,salute | med
SHIELD | =PROTECT | shield,cover,screen | med
LOSER | =LOSE+PERSON | loser,losers | high
MARYAM | =fs:MARYAM | maryam,mary | med
ISRAIL | =fs:ISRAIL | israel,israil | med
DISCIPLE | =FOLLOW+PERSON | disciple,disciples,apostles,hawariyyun | med
YET | =NOT+FINISH | yet,not yet | med
LEAN | =FALL | lean,incline,propped | low
CAREFUL | V @base.back:u4 p:D f:F at:knuckles > @base.back:u1 at:knuckles d:0.12 ;x2 | V @neutral p:D f:FI | careful,beware,cautious,caution | high
NURSE | =FEED+BABY | nurse,breastfeed,suckle,wet nurse | low
PHARAOH | =fs:FIRAWN | pharaoh,firawn | med
COMPLAIN | claw5 @chest:u2 p:B f:U at:tipM > @chest:u2 ~tap:1.5 | complain,complaint,lament | high
SIXTY | 6 @neutral:u8 p:B f:U > O d:0.2 | sixty | high
FOURTH | 4 @neutral:u8 p:B f:U ~twist:30 | fourth | high
SIXTH | 6 @neutral:u8 p:B f:U ~twist:30 | sixth | high
ANYWHERE | =WHERE | anywhere,wherever | med
MIGHTY | =POWER | mighty,exalted in might,aziz | high
FORTRESS | =PROTECT+BUILDING | fortress,fortresses,stronghold | low
FEAR | =AFRAID | fear,terror | high
TOWARD | =TO | toward,towards | high
TOGETHER | =WITH | together,united,jointly | high
UNITED | =JOIN | united,unity | high
RECENT | =PAST | recent,recently,just before | med
TOMORROW | A @cheek:o4 p:I f:U at:tipT > @cheek:o4f8 at:tipT ~arc:u2 d:0.3 | tomorrow | high
FAITH | =BELIEVE | faith | high
GIVER | =GIVE+PERSON | giver,bestower,granter | med
ASSOCIATE | =SHIRK | associate,associates | low
DOWRY | =GIFT+MARRY | dowry,mahr,bridal gift | low
STEAL | V @base.wrist:b4 p:D f:I > bentV @base.wrist:o8b6 d:0.2 | B @neutral p:D f:FI | steal,stole,theft,thief | high
ADULTERY | =fs:ZINA | adultery,unlawful sexual intercourse,zina,fornication | low
HURT | =PAIN | hurt,harm,annoy | high
AHMAD | =fs:AHMAD | ahmad | med
COMPLETE | =FINISH | complete,perfect,perfected,completion | high
WISDOM | =WISE | wisdom,hikmah | high
JEWISH | claw5 @chin p:B f:D at:tipM > @chin:d6 at:tipM d:0.25 | jewish,jew,jews,judaism | med
WILL | =FUTURE | will | med
TREASURE | =MONEY | treasure,treasures,depositories | low
LOSS | =LOSE | loss,mutual loss | high
GAIN | =WIN | gain,profit | med
OVERLOOK | =FORGIVE | overlook,forbear | med
WAY | =PATH | way,way out,means | high
MONTHLY | =MONTH | monthly,menstruation,menses | low
ANYMORE | =NOT+CONTINUE | anymore,no longer | med
ABILITY | =CAN | ability,capacity,means | high
DISCUSS | 1 @base.palm:u6 p:I f:F at:ulnar > @base.palm:u1 at:ulnar d:0.12 ;x2 | B @neutral p:U f:FI | discuss,consult,consultation,shura | high
TERRIBLE | =AWFUL | terrible | high
JIBRIL | =fs:JIBRIL | jibril,gabriel | med
MARRIED | =MARRY | married,previously married | high
FUEL | =WOOD | fuel | low
BETRAY | =CHEAT | betray,betrayal,treachery,treacherous | med
CHASTITY | =PRIVATE | chastity,chaste | low

# ---------- batch 8: Juz 27 ----------
DESIRE | =WANT | desire,desires,whim,inclination,lust | high
DAWN | =MORNING | dawn,daybreak,before dawn,sahar | high
GUEST | =VISIT+PERSON | guest,guests,visitor | med
CALLER | =CALL+PERSON | caller,summoner,herald | med
FAT | claw5 @cheek:o4 p:B f:U > @cheek:o8 d:0.25 ;sym | fat,fattened,plump | high
HIT | =STRIKE | hit,slap,struck | high
BUSINESS | =WORK | business,errand,mission | med
EXPAND | 5 @neutral:o4 p:I f:F > claw5 @neutral:o16 d:0.4 ;sym | expand,expanding,extend,enlarge | high
LISTENER | =LISTEN+PERSON | listener,eavesdropper | med
PIECE | =SOME | piece,fragment,part | med
CLOSER | =NEAR+MORE | closer,nearer | high
ANOTHER | =OTHER | another | high
UNFAIR | =NOT+FAIR | unfair,unjust division | high
CLAIM | =SAY | claim,boast of | med
EMIT | =SPURT | emit,emitted,ejected | med
CARE | V @neutral:u4 p:D f:F ~circle:U4x1 | V @neutral:d2 p:D f:F | care,heed,concern | high
NAIL | 1 @base.back:u6 p:B f:D > @base.back:u1 d:0.1 ;x2 | B @neutral p:D f:FI | nail,nails,planks | low
PULL | =DRAG | pull,pulled,uproot | high
ROOT | =SEED+DOWN | root,roots,trunk | low
STICK | =STAFF | stick,sticks,dry twigs,stubble | med
WORSE | =BAD+MORE | worse,more grievous | high
BITTER | =SALTY | bitter,more bitter | med
BLINK | L @eye:f2 p:I f:U at:tipI > baby0 d:0.08 | blink,twinkling,glance | med
HIDDEN | =HIDE | hidden,inward,batin | high
HIGHER | =HIGH+MORE | higher,greater rank | high
OUTSIDE | =OUT | outside,exterior | high
DECEIVER | =DECEIVE+PERSON | deceiver,the deceiver | med
RANSOM | =PAY | ransom | med
AMUSEMENT | =PLAY | amusement,diversion | high
FARMER | =PLANT+PERSON | farmer,farmers,sower,tiller | med
BOAST | =PROUD | boast,boastful,braggart | high
FOLLOWER | =FOLLOW+PERSON | follower,followers | high
MONK | =WORSHIP+ALONE+PERSON | monk,monks,monasticism | low

# ---------- batch 9: Juz 26 ----------
BEDOUIN | =DESERT+PEOPLE | bedouin,bedouins,desert arabs,arabs | low
DESERT | =DRY+LAND | desert,wilderness | med
SPOILS | =WIN+THING | spoils,booty,war gains | med
VOICE | C @neck:f2 p:B f:U at:tipI > @neck:f6u4 d:0.25 | voice,voices,sound | high
FIX | =CHANGE+GOOD | fix,amend,improve,set right | med
STRONGER | =POWER+MORE | stronger,mightier | high
THIRTY | 3 @neutral:u8 p:B f:U > O d:0.2 | thirty | high
FORTY | 4 @neutral:u8 p:B f:U > O d:0.2 | forty | high
UGH | 5 @neutral:u6 p:F f:U > @neutral:u8f6 d:0.15 ;face:frown=0.8,browDown=0.6 | uff,ugh,fie | med
MILK | S @neutral:u2 p:I f:F > C d:0.12 ;x3 | milk | high
WINE | W @cheek p:B f:U at:tipI ~circle:B2x2 | wine,intoxicant | high
HONEY | open8 @chin:o2 p:B f:U at:tipM > @chin:o6 at:tipM d:0.2 ;face:smile=0.4 | honey | med
JUST | =NOW | just now,just | med
SIGN | =SIGN-PROOF | sign,signs,indication,portent | high
FAINT | =FALL+SLEEP | faint,swoon,fainting | low
MATTER | =THING | matter,case,affair | high
LOCK | X @base.palm:u4 p:D f:F > @base.palm:u1 ~twist:60 d:0.25 | B @neutral p:U f:FI | lock,locked,locks | high
PUSH | B @neutral:b2 p:F f:U > @neutral:f12 d:0.2 ;sym | push,press,pressure | high
ADD | =MORE | add,added,increase | high
LAME | =WALK+HARD | lame,disabled | low
GUILTY | =SIN | guilty,guilt,blame | med
DREAM | 1 @temple:f2 p:B f:IU at:tipI > X @temple:o14u8 ~wiggle:10 d:0.4 | dream,vision,dreamed | high
SHAVE | Y @cheek:u2 p:B f:U at:tipT > @jaw:d2 at:tipT d:0.2 ;x2 | shave,shaved,shaving | high
SHORT | H @base.pipI:u2 p:I f:FI > @base.pipI:u2b3 d:0.12 ;x2 | H @neutral p:I f:FO | short,shorten,shortened,trimmed | high
SPROUT | =PLANT | sprout,shoot,shoots | med
CHECK | V @eyes:f4 p:D f:F at:tipI > @base.palm:u4 d:0.3 | B @neutral p:U f:FI | check,verify,investigate,inspect | high
INSULT | 1 @neutral:b2u4 p:D f:F > @far:u6 d:0.15 ;face:browDown=0.6 | insult,insults,defame | high
SPY | =SECRET+LOOK | spy,spying | med
NATION | =PEOPLE | nation,nations,peoples | high
TRIBE | =GROUP | tribe,tribes,clan | med
STRANGE | C @face:o4f8 p:I f:U > @face:i6f8 ~arc:d3 d:0.3 ;face:browDown=0.4 | strange,amazing,odd,weird | high
CONFUSED | claw5 @forehead:f6 p:B f:U ~circle:F3x1 | claw5 @neutral:u6 p:U f:F ~circle:F3x1 | confused,confusion,perplexed | high
FOREST | =TREE+MANY | forest,wood,thicket | med
RECEIVE | =GET | receive,received,receivers | high
DRIVER | =DRIVE+PERSON | driver | med
SIGHT | =SEE | sight,vision | high
SHARP | B @base.radial:u2 p:D f:F at:tipM > @base.radial:f4 at:tipM d:0.15 | B @neutral p:I f:FO | sharp,keen,acute | high
SEARCH | =SEEK | search,searched,roam | high
SUNRISE | =MORNING | sunrise,rising of the sun | high
SUNSET | =EVENING | sunset,setting of the sun | high
FORCE | C @neutral:u4 p:B f:U > @neutral:d4f6 p:D d:0.2 | force,compel,coerce | high

# ---------- batch 10: Surahs 41-42 ----------
WILLING | =WANT | willing,willingly | high
FIRM | =STRONG | firm,firmly,firmly set | high
ARRIVE | bentB @far:u2 p:B f:U > @base.palm:u1 p:D d:0.3 | B @neutral p:U f:FI | arrive,arrived,reach | high
MUCH | =MANY | much | high
TWIST | X @neutral:o2 p:D f:F ~twist:60 ;sym | twist,distort,deviate | med
MULTIPLY | =MORE+MANY | multiply,multiplying,increase in number | med
KEY | X @base.palm:u4 p:I f:F at:pipI > @base.palm:u4 ~twist:50 h:0.3 | B @neutral p:I f:U | key,keys | high
ORDAIN | =COMMAND | ordain,ordained,prescribe | med
ARGUMENT | =ARGUE | argument,arguments,dispute | high
VEIL | =COVER | veil,partition,curtain | med
PERMISSION | =ALLOW | permission | high

# ---------- batch 11: Surahs 43-45 ----------
THESE | =THEY | these | high
ROOF | B @aboveHead:f8 p:D f:F > @aboveHead:o12f8 d:0.3 ;sym | roof,roofs,ceiling | high
DISTANCE | =FAR | distance | med
PLATE | =CUP | plate,plates,dish | low
LANGUAGE | L @neutral:o4u4 p:D f:F > @neutral:o14u4 ~shake:1 d:0.35 ;sym | language,tongue,speech | high
KNEEL | bentV @base.palm:u4 p:B f:D > @base.palm:u0 d:0.25 | B @neutral p:U f:FI | kneel,kneeling | high

# ---------- batch 12: Surahs 38-40 ----------
NOBODY | =NONE | nobody,no one,none | high
NINETY | =NINE+TEN | ninety | low
TREAT | =DO | treat,deal with | med
SPECIAL | F @neutral:u2 p:I f:F > @neutral:u10 d:0.3 | 1 @neutral p:I f:U | special,exclusive,particular | med
MISS | C @face:o4 p:I f:F > S @face:o10 d:0.25 | miss,missed,overlook | med
PRETEND | =FALSE | pretend,pretentious,pretense | med
COLOR | 5 @chin:f4 p:B f:U ~wiggle:25 h:0.5 | color,colors,colour,colours | high
CROOKED | X @neutral:u8 p:I f:U > @neutral:d4o4 ~shake:2 d:0.4 | crooked,deviance,deviation,crookedness | med
THREATEN | =WARN | threaten,threatens,threat | med
SHRINK | B @neutral:o10 p:I f:F > @neutral:o3 d:0.35 ;sym | shrink,shrinks,contract | med
FOLD | B @neutral:o8 p:U f:F > @neutral:o2u6 p:D d:0.35 | B @neutral:o6 p:U f:F | fold,folded,roll up | med
CHASE | =FOLLOW+HURRY | chase,chased,pursue,pursued | med
DELICIOUS | 8 @lips p:B f:U > 8 @lips:f6 ~twist:40 d:0.3 | delicious,tasty,delight | high
EGG | H @neutral:u4 p:I f:F > @neutral:d2o3 ~twist:40 d:0.25 | H @neutral:u4 p:I f:F | egg,eggs | med
BOTTOM | B @neutral:d6 p:D f:F > @neutral:d10 d:0.25 | B @neutral:u2 p:D f:FI | bottom,depth,base | med

# ---------- batch 13: Surahs 34-37 ----------
SWEET | B @chin p:B f:U > @chin:d3 d:0.15 ;x2 | sweet,palatable,fresh water | high
BOWL | C @neutral:o4 p:U f:F > @neutral:o10u2 ~arc d:0.3 ;sym | bowl,bowls,basin,reservoir | med
FLOOD | 5 @neutral:d4 p:D f:F > @neutral:u8 ~wiggle:20 d:0.5 ;sym | flood,deluge | high
ADOPT | 5 @neutral:o6f6 p:D f:F > S @chest d:0.35 | adopt,adopted,claimed son | med
SHY | bentB @cheek p:B f:U > @cheek ~twist:40 d:0.3 ;face:browInnerUp=0.4 | shy,embarrassed,bashful | high
UNCLE | U @temple:o2 p:F f:U ~shake:1.5 h:0.4 | uncle,uncles,paternal uncle,maternal uncle | high
AUNT | A @cheek:o2 p:F f:U ~shake:1.5 h:0.4 | aunt,aunts,paternal aunt,maternal aunt | high
INK | I @neutral:u4 p:I f:F > @neutral:d2 ~wiggle:15 d:0.3 | B @neutral p:U f:FI | ink | low
WAVE | B @neutral:o10d2 p:D f:F > @neutral:u6 ~arc d:0.25 > @neutral:o10d2 d:0.25 ;sym | wave,waves | high
SPIDER | claw5 @neutral:d2 p:D f:F ~wiggle:30 h:0.5 | claw5 @neutral:d2 p:D f:F | spider,spiders | high
YESTERDAY | Y @cheek:f2 p:F f:U > @cheek:b4 d:0.25 | yesterday,previous day | high
HIRE | =WORK+GIVE | hire,employ,hired | med
WOW | 5 @face:f8 p:F f:U > @face:f8 ~shake:2 d:0.3 ;face:mouthOpen=0.5,browUp=0.7 | wow,oh,how amazing | med
WARM | claw5 @mouth:f2 p:B f:U > 5 @mouth:f10 d:0.3 | warm,warmth,warm yourselves | high
SNAKE | bentV @mouth:f4 p:D f:F > @neutral:f12 ~shake:2 d:0.45 | snake,serpent | high
ANT | X @base.back:u2 p:D f:F > @base.back:u2f6 ~wiggle:20 d:0.4 | B @neutral p:D f:FI | ant,ants | high
PALACE | =KING+HOUSE | palace,castle | med
WANDER | 1 @neutral:u4 p:F f:U > @neutral:o8u2 ~arc > @neutral:o2 ~arc d:0.5 | wander,wandering,roam | med
SMILE | G @mouth:o2 p:B f:I > @cheek:u2 d:0.3 ;sym face:smile=0.9 | smile,smiled,smiling | high
SKILL | 5 @base.ulnar p:I f:F > S @base.ulnar:f6 d:0.3 | B @neutral p:I f:F | skill,skilled,skillful,expert | high

# ---------- batch 14: Surahs 25-33 ----------
BUY | flatO @base.palm:u2 p:U f:F > @neutral:f12u2 ~arc d:0.3 | B @neutral p:U f:F | buy,bought,purchase | high
MARKET | =BUY+PLACE | market,markets,marketplace | med
NARROW | B @neutral:o10 p:I f:F > @neutral:o3 d:0.35 ;sym | narrow,confined,tight | high
BITE | C @neutral:f2 p:D f:F > S @base.side:u2 d:0.25 | B @neutral:o4 p:I f:F | bite,bites,biting | med
THIN | I @cheek:u2 p:B f:U > @cheek:d6 d:0.3 ;sym face:puff=0 | thin,lean,skinny | med
CHURCH | C @base.back:u2 p:I f:F > @base.back d:0.12 ;x2 | S @neutral p:D f:FI | church,churches | high
LEAF | 1 @base.tipI:d2 p:D f:D > @base.tipI:d2 ~twist:30 h:0.4 | B @neutral:u4 p:I f:U | leaf,leaves | med
SHOE | S @neutral:o4 p:D f:F > @neutral:o1 d:0.1 ;x2 sym | shoe,shoes,sandal,sandals | high
BOX | B @neutral:o8u2 p:I f:F > @neutral:o8u2 p:B f:I d:0.3 ;sym | box,chest,casket,ark | high
FESTIVAL | =HAPPY+DAY | festival,feast,celebration | med
BLUE | B @neutral:o4 p:B f:U ~twist:30 h:0.4 | blue,blue-eyed | high
DISAPPOINT | 1 @chin p:B f:U at:tipI > @chin:d1 d:0.2 ;face:frown=0.5 | disappoint,disappointed,unhappy | high

# ---------- batch 15: Surahs 18-22 ----------
CAVE | C @neutral:f4u2 p:I f:F > @neutral:f10u2 ~arc d:0.35 | C @neutral:u2 p:D f:FI | cave,cavern | med
DOG | 5 @hip:f2 p:I f:D > @hip:u2f2 d:0.12 ;x2 | dog,dogs | high
HOW-LONG | =HOW+TIME | how long | high
WASTE | flatO @base.palm:u2 p:U f:F > 5 @neutral:f10d2 d:0.25 | B @neutral p:U f:F | waste,wasteful,squander,extravagant | high
MUD | =WATER+DIRTY | mud,clay mud,black mud | med

# ---------- batch 16: Surahs 12-17 ----------
SHIRT | F @chest:o8u4 p:B f:U > @chest:o8u4f2 d:0.12 ;x2 sym | shirt,garment,tunic | high
BAG | S @hip:o4f6 p:I f:D > @hip:o4f6d4 d:0.25 | bag,saddlebag,sack,baggage | high
SEDUCE | =TRY+TRICK | seduce,seduced,tempt,entice | med
WOLF | 5 @nose:f6 p:B f:U > flatO @nose:f12 d:0.3 | wolf,wolves | high
AGREE | 1 @temple p:D f:F > @neutral:f6 p:D f:F d:0.3 ;face:nod=0.1 | agree,agreed,consent | high
BUCKET | S @neutral:o6u2 p:I f:F > @neutral:o6d8 d:0.4 | bucket,pail | med
KNIFE | H @base.tipI p:I f:F > @base.tipI:f6 d:0.15 ;x2 | H @neutral p:I f:F | knife,knives,blade | high
BREAD | bentB @base.back:u4 p:B f:I > @base.back:d4 d:0.15 ;x2 | B @chest:f8 p:B f:I | bread,loaf | high
CONVINCE | =SAY+PUSH | convince,persuade,dissuade | med
COOK | B @base.palm:u1 p:D f:F > @base.palm:u1 p:U d:0.2 ;x2 | B @neutral p:U f:F | cook,cooked,roast,roasted | high
SCHOLAR | =KNOWLEDGE+PERSON | scholar,scholars,rabbi,rabbis,learned | med
COPY | 5 @base.palm:f4 p:B f:F > flatO @base.palm d:0.25 | B @neutral p:B f:U | copy,imitate,imitating | high
BLOW-OUT | O @mouth:f4 p:I f:F > 5 @mouth:f12 d:0.25 ;face:puff=0.6 | extinguish,blow out,put out | med

# ---------- batch 17: Surahs 8-9 ----------
WEAPON | =FIGHT+THING | weapon,weapons,armed,arms | med
WHISTLE | V @mouth:f2 p:F f:U > @mouth:f2 d:0.3 ;face:purse=0.8 | whistle,whistling | med
CLAP | B @neutral:f4 p:D f:F > @base.palm d:0.08 ;x2 | B @neutral p:U f:F | clap,clapping,handclapping | high
NEEDLE | F @base.tipI:u2 p:I f:U > @base.tipI:u6 d:0.25 | 1 @neutral p:I f:U | needle,eye of a needle | med
HOLE | F @neutral:f6 p:F f:U > @neutral:f6 ~circle d:0.4 | hole,opening,niche | med

# ---------- batch 18: Surahs 6-7 ----------
SHEEP | V @base.back:u2 p:D f:F > @base.back:u6 d:0.15 ;x2 | B @neutral p:D f:FI | sheep,ewe,ewes,lamb | high
GOAT | V @chin p:B f:U > bentV @chin d:0.15 > V @forehead d:0.2 > bentV @forehead d:0.15 | goat,goats | high

# ---------- batch 19: Surah 5 ----------
HUNT | L @neutral:o4f6 p:I f:F > @neutral:o4f6 d:0.12 ;x2 sym | hunt,hunting,game | high
WIPE | B @base.palm:u2 p:D f:F > @base.palm:u2f6 d:0.2 ;x2 | B @neutral p:U f:F | wipe,wiping,rub | high
GAMBLE | A @neutral:o4 p:U f:F > @neutral:f8 ~twist:40 d:0.3 | gamble,gambling,games of chance | med
TABLE | B @neutral:u2 p:D f:F > @neutral:u2f6 d:0.15 ;x2 sym | table,spread table | high
ELBOW | 1 @base.ulnar:d8 p:D f:D at:tipI > @base.ulnar:d8 d:0.1 ;x2 | B @neutral p:B f:U | elbow,elbows | high
BATHROOM | T @neutral:o4 p:F f:U ~shake:1.5 h:0.4 | bathroom,toilet,privy,relieving | high
NEIGHBOR | =NEAR+PERSON | neighbor,neighbour,neighbors | high
WORKER | =WORK+PERSON | worker,workers,laborer | high
WRITER | =WRITE+PERSON | writer,scribe,scribes | high
INDIRECT | 1 @neutral:u4 p:F f:U > @neutral:o6 ~arc d:0.35 | indirect,allude,hint | low
`;
