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
FROWN | bent5 @eyes:f6u3 p:B f:U > @eyes:f6 d:0.25 ;sym face:browDown=1,frown=0.8 | frown,frowned,scowl | med
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
SHAME | bentB @cheek:d2 p:B f:U at:back > @cheek:u2 at:back d:0.3 ;sym face:browInnerUp=0.6,frown=0.3 | shame,humiliate,disgrace,embarrass | high
INHERIT | 5 @shoulder:f6 p:B f:U > @neutral:f12d2 ~arc:u4 d:0.4 ;sym | inherit,inheritance | med
GREEDY | claw5 @far p:U f:F > S @chest:f4 d:0.3 ;face:browDown=0.4,squint=0.4 | greedy,greed,devour | med
FREE | F @neutral:i3 p:B f:U > @neutral:o12 p:F d:0.3 ;sym | free,freedom,release,liberate | high
LEFT | L @neutral:o2 p:F f:U > @neutral:i10 d:0.3 | left,left side,companions of the left | high
RIGHT-SIDE | R @neutral:o2 p:F f:U > @neutral:o14 d:0.3 | right side,right hand,companions of the right | high
QUIET | B @lips:f2 p:I f:U > @neutral:o10 p:D f:F d:0.4 ;sym | quiet,still,calm,silent | high
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
GOAL | 1 @forehead:o4 p:B f:U at:tipI > @base.tipI at:tipI d:0.4 | 1 @high:f20 p:B f:U | goal,destination,aim,purpose | high
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
SICK | open8 @forehead:o2 p:B f:U at:tipM | open8 @stomach p:B f:U at:tipM | ill,sick,sickness,disease,illness | high
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
DEAF | 1 @ear:f2i2 p:F f:O at:tipI > @mouth:o3 at:tipI d:0.3 | deaf | high
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
HEAD | bentB @temple:u2 p:B f:U at:tipM > @jaw at:tipM d:0.25 | head,heads | high
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
`;
