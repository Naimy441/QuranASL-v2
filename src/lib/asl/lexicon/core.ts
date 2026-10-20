// Core ASL vocabulary: pronouns, function words, questions, time, numbers,
// people, emotions and frequent verbs.  Right hand dominant.
// GLOSS | def | english | conf | note
export const LEX_CORE = String.raw`
# ---------- pronouns & indexing ----------
ME | 1 @chest:f1 p:I f:B | i,me,myself | high
MY | B @chest p:B f:I | my,mine | high
YOU | 1 @neutral:f12u4 p:D f:F | you,thou | high
YOUR | B @neutral:f14u4 p:F f:U | your,yours,thy | high
IX-a | 1 @neutral:o8f8u3 p:D f:FO | he,him,she,her,it,that one | high | point to locus a
IX-b | 1 @neutral:i6f8u3 p:D f:FI | | high | point to locus b
IX-c | 1 @neutral:f14u3 p:D f:F | | high | point to locus c
IX-up | 1 @high:o5f4 p:F f:U > @high:o5u8f4 d:0.18 | | high | point upward
IX-down | 1 @neutral:f6 p:B f:D > @low:f6 d:0.18 | | high
HE | =IX-a | he,him,she,her,it | high
POSS-a | B @neutral:o8f8u3 p:FO f:U > @neutral:o12f12u3 d:0.15 | his,her,its | high
THEY | 1 @neutral:i4f10 p:D f:FI > @neutral:o18f8 f:FO d:0.35 | they,them,those | high
THEIR | B @neutral:i4f10 p:F f:U > @neutral:o18f8 p:FO d:0.35 | their,theirs | high
WE | 1 @chestSide:u4 p:D f:B > @^chestSide:u4 ~arc:f7 d:0.35 | we,us | high
OUR | curvedB @chestSide p:I f:U > @^chestSide p:B ~arc:f8 d:0.4 | our,ours | high
YOU-ALL | 1 @neutral:i8f12 p:D f:F > @neutral:o14f12 d:0.35 | you all,ye | high
SELF | 10 @neutral:o6f8 p:I f:F > @neutral:o6f13 d:0.12 ;x2 | self,himself,itself | high
MYSELF | 10 @chest:f6 p:O f:B at:knuckles > @chest:f1 d:0.12 ;x2 | myself | high
THIS | 1 @base.palm:u5 p:B f:D > @base.palm:u1 d:0.12 | B @neutral p:U f:FI | this | med
THAT | Y @base.palm:u7 p:D f:F > @base.palm:u1 d:0.12 | B @neutral p:U f:FI | that | high
HERE | B @neutral:o6 p:U f:F ~circle:U5x1 ;sym | here | high
THERE | 1 @neutral:o12f10 p:D f:FO > @neutral:o14f16 d:0.15 | there | high
WHO-REL | 1 @neutral:o6f8 p:D f:FO > @neutral:o8f10 d:0.12 | who,whom,which,whoever | med | relative marker (point)

# ---------- question words ----------
WHAT | 5 @neutral:o8 p:U f:F > @neutral:o11 d:0.15 ;sym x2 face:browDown=0.8 | what | high
WHO | 1 @chin:f3 p:I f:U at:tipI ~circle:B2x2 ;face:browDown=0.8 | who | high
WHY | B @temple p:B f:IU at:tipM > Y @forehead:o4f12 p:B f:U d:0.25 ;face:browDown=0.8 | why | high
HOW | curvedB @neutral:o2u2 p:B f:D > @neutral:o4u4 p:U f:F d:0.25 ;sym face:browDown=0.8 | how | high
WHERE | 1 @neutral:u8f2 p:F f:U ~shake:2 ;face:browDown=0.8 | where | high
WHEN | 1 @base.tipI:u5o3 p:D f:F ~circle:U3x1 > @base.tipI:u1 at:tipI d:0.12 | 1 @neutral p:B f:U | when | med
WHICH | 10 @neutral:o8 p:I f:F > @neutral:o8u6 d:0.2 ;alt x2 face:browDown=0.6 | which | high
HOW-MANY | S @neutral:u2 p:U f:F > 5 @neutral:u6 d:0.2 ;face:browDown=0.8 | how many,how much | high

# ---------- function words ----------
AND | 5 @neutral:o2 p:B f:I > flatO @neutral:o16 d:0.3 | and | med
BUT | 1 @neutral:i4u4 p:F f:U > @neutral:o12u4 d:0.25 ;sym | but,however,yet | high
IF | I @temple p:B f:IU at:tipP > @temple:f12 d:0.25 ;face:browUp=0.8 | if,suppose,whether | high
BECAUSE | 1 @temple p:B f:IU at:tipI > A @forehead:o12u6 d:0.3 | because,for,since | high
WITH | A @neutral:o4 p:I f:F > @neutral:o1 d:0.2 ;sym | with,together | high
WITHOUT | A @neutral:o1 p:I f:F > 5 @neutral:o10 p:U d:0.25 ;sym | without | high
FOR | 1 @temple p:B f:IU at:tipI > @temple:f12 f:F d:0.25 | for | high
FROM | X @base.tipI:b2 p:I f:F > @base.tipI:b12 d:0.25 | 1 @neutral:f6 p:B f:U | from | high
TO | 1 @neutral:b4 p:D f:F > @base.tipI at:tipI d:0.25 | 1 @neutral:f6 p:B f:U | to,toward,unto | high
IN | flatO @base.palm:u8 p:D f:D > @base.palm:d2 d:0.25 | C @neutral p:I f:F | in,into,within,inside | high
ON | B @base.back:u6 p:D f:F > @base.back:u1 d:0.2 | B @neutral p:D f:FI | on,upon | high
ABOVE | B @base.back:u4 p:D f:FI > @base.back:u14 d:0.3 | B @neutral p:D f:FI | above,over | high
UNDER | B @base.palm:d6 p:D f:FI > @base.palm:d14 d:0.3 | B @neutral p:D f:FI | under,beneath,below | high
NEAR | bentB @neutral:o14 p:B f:FI > @neutral:o4 d:0.25 | bentB @neutral:f4 p:B f:FI | near,close | high
FAR | A @neutral:o3 p:I f:F > @far:o16f10 d:0.35 | A @neutral:i0 p:I f:F | far,distant | high
BEHIND | 10 @neutral:f10 p:I f:F > @neutral:b2 d:0.3 | 10 @neutral:f6 p:I f:F | behind,back | high
BEFORE | B @base.palm:b2 p:F f:I > @base.palm:b16 d:0.3 | B @neutral:f6 p:B f:FI | before,prior | high
AFTER | B @base.back:b4 p:B f:I > @base.back:f10 d:0.3 | B @neutral p:B f:FI | after,afterward,then | high
UNTIL | 1 @neutral:o12 p:F f:FU > @base.tipI at:tipI ~arc:u6 d:0.4 | 1 @neutral:f4 p:F f:U | until,till | high
ONLY | 1 @neutral:u6f4 p:F f:U > p:B d:0.25 | only,alone,sole,except | high
ALONE | 1 @neutral:u6 p:B f:U ~circle:U4x2 | alone,lonely | high
ALSO | 1 @neutral:o8 p:D f:F > @neutral:o2 d:0.15 | also,too | high
NOT | 10 @chin:d1 p:I f:F at:tipT > @chin:f14d2 d:0.2 ;face:shake=0.12,browDown=0.4 | not,no,nor,neither | high
NO | U @neutral:u8 p:F f:U > flatO d:0.12 ;x2 face:shake=0.15 | no | high
YES | S @neutral:u8 p:F f:U > @neutral:u5f3 p:D f:F d:0.12 ;x2 face:nod=0.1 | yes,indeed | high
NONE | O @neutral:f6 p:F f:U > @neutral:f6o14 d:0.35 ;sym face:shake=0.12 | none,nothing,no one | high
NEVER | B @face:o10f8 p:I f:U > @neutral:o6 p:D ~arc:o6 d:0.35 ;face:shake=0.15 | never | med
TRUE | 1 @mouth:f2 p:I f:U at:radial > @mouth:f16 d:0.25 | true,truth,truly,indeed,real,really,surely,certain | high
FALSE | 1 @nose:o4 p:I f:U at:radial > @nose:i8 d:0.2 | false,fake,falsehood | high
RIGHT | 1 @base.pipI:u5 p:I f:FI > @base.pipI:u1 d:0.12 | 1 @neutral p:I f:FI | right,correct | high
WRONG | Y @chin:f3 p:B f:U at:knuckles > @chin:f1 d:0.1 | wrong,error,mistake | high
SAME | Y @neutral p:D f:F > @neutral:o10 d:0.15 ;x2 | same,like,similar,equal | high
EQUAL | bentB @neutral:o8 p:D f:FI > @neutral:o3 at:tipM d:0.12 ;sym x2 | equal,equivalent,comparable | high
DIFFERENT | 1 @neutral:i3 p:D f:FI > @neutral:o14 f:F d:0.3 ;sym | different,differ,various | high
OTHER | 10 @neutral:u4 p:I f:F > @neutral:o10u4 p:D d:0.25 | other,another,else | high
VERY | V @neutral:o2u4 p:F f:U > @neutral:o12u4 d:0.25 ;sym | very,much | med
MAYBE | B @neutral:o8 p:U f:F > @neutral:o8u4 d:0.15 ;alt x2 | maybe,perhaps,might | high
HAPPEN | 1 @neutral:o6 p:U f:F > p:D d:0.25 ;sym | happen,occur,event | high
THING | B @neutral:o4 p:U f:F > @neutral:o14 d:0.15 ;x2 | thing,things,matter,affair | high
SOMETHING | 1 @neutral:u6 p:F f:U ~circle:F3x1 | something,anything | high
EVERY | A @base.radial:u2 p:I f:F > @base.radial:d3 d:0.15 ;x2 | A @neutral p:I f:F | every,each | high
ALL | openB @neutral:o4u4f8 p:F f:U > @neutral:d4f6 p:U f:I ~arc:f10 d:0.4 | B @neutral:u0f4 p:B f:I | all,whole,entire,every | high
EVERYTHING | =EVERY+THING | everything | high
SOME | B @base.palm at:ulnar p:I f:F > @base.palm:b5 at:ulnar d:0.25 | B @neutral p:U f:FI | some,part,portion | high
MANY | S @neutral:o6u2 p:U f:F > 5 d:0.15 ;sym x2 | many,numerous,much | high
MORE | flatO @neutral:o8f6 p:I f:F at:tipM > @neutral:o2f6 d:0.15 ;sym x2 | more,increase,add | high
MOST | 10 @neutral:d4 p:I f:F > @high d:0.3 | 10 @neutral:d2 p:I f:F | most,greatest | med
FEW | A @neutral:u4 p:U f:F > 5 d:0.35 | few,little | med
LITTLE | B @neutral:o8 p:I f:F > @neutral:o3 d:0.25 ;sym | little,small,tiny | high
BIG | bentL @neutral:o6f8 p:I f:F > @neutral:o22f8 d:0.35 ;sym | big,large,great,huge,vast | high
GREAT | 5 @face:o12f10 p:F f:U > @face:o14f14u4 d:0.15 ;sym x2 face:eyesWide=0.4,browUp=0.5 | great,wonderful,magnificent,tremendous,mighty | med
LONG | 1 @base.back:u2 p:D f:I > @base.back:b16u4 d:0.4 | B @neutral p:D f:FI | long | med
HIGH | bentB @neutral:u4 p:D f:F > @high:u8 d:0.3 | high,exalted,elevated | high
HIGHEST | bentB @neutral:u4 p:D f:F > @aboveHead:o4 d:0.4 ;face:browUp=0.6 | highest,most high,supreme | med
LOW | bentB @neutral p:D f:F > @low:d4 d:0.3 | low,lowest,lower | high
FIRST | 1 @base.tipT:o3u3 p:I f:F > @base.tipT:o2 d:0.12 | 10 @neutral p:I f:F | first,former | high
LAST | I @base.tipP:u6 p:I f:D > @base.tipP:d6 d:0.25 | I @neutral p:B f:F | last,final,latter,end | high
FINISH | 5 @neutral:o4 p:B f:U > p:D f:FO d:0.2 ;sym | finish,complete,completed,already | high
START | 1 @base.palm:o2 p:D f:FI ~twist:45 | B @neutral p:I f:F | start,begin,beginning | med
AGAIN | bentB @neutral:u10 p:U f:F > @base.palm at:tipM p:D d:0.25 | B @neutral p:U f:FI | again,repeat,return | high
CONTINUE | 10 @neutral:b4 p:D f:F > @far d:0.35 | 10 @neutral:b4d4 p:D f:F > @far:d4 d:0.35 | continue,keep,remain,persist | high
STOP | B @base.palm:u12 p:I f:F at:ulnar > @base.palm:u1 at:ulnar d:0.15 | B @neutral p:U f:FI | stop,halt,cease | high
WAIT | 5 @neutral:o6 p:U f:F ~wiggle:15 ;sym | wait,await | high
NOW | Y @neutral:u6 p:U f:F > @neutral:u0 d:0.2 ;sym | now,present | high
THEN | L @neutral:u2 p:I f:F > @neutral:o6u2 d:0.2 | then,next | med

# ---------- time ----------
DAY | 1 @neutral:o14u10f4 p:B f:U > @neutral:i2u0f6 f:FI ~arc:u4 d:0.5 | B @neutral:d6 p:D f:FI | day,daytime | high
NIGHT | bentB @base.back:u6o6 p:D f:FI > @base.back:u2i2 d:0.25 | B @neutral:d4 p:D f:FI | night,nightfall | high
MORNING | openB @neutral:d10f8 p:B f:FU > @neutral:u6f10 f:U d:0.45 | B @neutral:d4f4 p:D f:FI | morning,dawn,daybreak,sunrise | high
EVENING | bentB @neutral:u12o6 p:F f:U > @neutral:u2o2 p:D d:0.45 | B @neutral:d2 p:D f:FI | evening,sunset,dusk,twilight | med
TODAY | =NOW+DAY | today | high
TIME | X @base.back:b4u3 p:D f:F at:tipI > @base.back:b4u0 d:0.1 ;x2 | S @neutral p:D f:FI | time,period,era | high
HOUR | 1 @base.palm:o2 p:I f:U ~circle:I4x1 | B @neutral p:I f:U | hour | high
YEAR | S @base.back:u3 p:D f:FI ~circle:I7x1 | S @neutral p:D f:FI | year,years | high
MONTH | 1 @base.tipI:u1o2 p:B f:I at:tipI > @base.pipI:d4o2 d:0.3 | 1 @neutral p:B f:U | month,months | high
WEEK | 1 @base.palm:b6 p:D f:F at:tipI > @base.palm:f6 d:0.3 | B @neutral p:U f:FI | week | high
PAST | B @shoulder:f6u6 p:B f:U > @shoulder:b4u10 d:0.3 | past,ago,before,previously | high
LONG-AGO | 5 @shoulder:f8u4 p:B f:U > @shoulder:b8u12 ~arc:u4 d:0.45 | long ago,ancient,old times | high
FUTURE | B @cheek:o6f2 p:I f:U > @cheek:o6f18 d:0.35 | future,will,shall,later,soon | high
LATER | L @neutral:u4 p:F f:U > @neutral:u2f3 p:FD f:FO d:0.25 | later | med
FOREVER | 1 @neutral:o4u4 p:D f:F ~circle:B4x1 > Y @neutral:o4f14 p:D f:F d:0.3 | forever,eternal,eternally,everlasting,abide | high
ALWAYS | 1 @neutral:u6f4 p:U f:FU ~circle:F4x2 | always,ever,continually | high
AGE | S @chin:f2 p:I f:F > @chin:d10f2 d:0.35 | age,old,aged | high

# ---------- numbers ----------
ONE | 1 @neutral:u8 p:B f:U | one,single,once | high
TWO | V @neutral:u8 p:B f:U | two,both,pair,twice | high
THREE | 3 @neutral:u8 p:B f:U | three | high
FOUR | 4 @neutral:u8 p:B f:U | four | high
FIVE | 5 @neutral:u8 p:B f:U | five | high
SIX | 6 @neutral:u8 p:B f:U | six | high
SEVEN | 7 @neutral:u8 p:B f:U | seven | high
EIGHT | 8 @neutral:u8 p:B f:U | eight | high
NINE | 9 @neutral:u8 p:B f:U | nine | high
TEN | 10 @neutral:u8 p:I f:F ~twist:30 | ten | high
NINETEEN | 10 @neutral:u8 p:I f:F > 9 p:B f:U d:0.2 ~twist:25 | nineteen | med
FIFTY | 5 @neutral:u8 p:B f:U > O d:0.2 | fifty | high
SEVENTY | 7 @neutral:u8 p:B f:U > O d:0.2 | seventy | high
HUNDRED | 1 @neutral:u8 p:B f:U > C d:0.2 | hundred | high
THOUSAND | bentB @base.palm:u5 p:D f:F at:tipM > @base.palm:u1 d:0.15 | B @low:u4 p:U f:FI | thousand | high
HALF | 1 @neutral:u6 p:B f:I > @neutral:u0 d:0.25 | half | med

# ---------- people ----------
PERSON | B @neutral:o8u6 p:I f:F > @neutral:o8d6 d:0.3 ;sym | person,human,one who,-er | high
PEOPLE | P @neutral:o8 p:D f:F ~circle:O4x2 ;sym | people,mankind,humanity,men,folk,nation | high
HUMAN | =PERSON | human,man,mankind | med
MAN | 5 @forehead p:I f:U at:tipT > @chest at:tipT d:0.3 | man,male | high
WOMAN | 5 @chin p:I f:U at:tipT > @chest at:tipT d:0.3 | woman,female,women | high
MOTHER | 5 @chin p:I f:U at:tipT > @chin:f3 at:tipT d:0.1 ;x2 | mother | high
FATHER | 5 @forehead p:I f:U at:tipT > @forehead:f3 at:tipT d:0.1 ;x2 | father,forefather | high
PARENTS | 5 @forehead p:I f:U at:tipT > @chin at:tipT d:0.3 | parents | high
BROTHER | L @forehead p:I f:F at:tipT > @neutral:u0 d:0.35 | L @neutral:d2 p:I f:F | brother | high
SISTER | L @jaw p:I f:F at:tipT > @neutral:u0 d:0.35 | L @neutral:d2 p:I f:F | sister | high
SON | B @forehead:o4 p:D f:F > @neutral:d2 p:U ~arc:f4 d:0.4 | B @neutral:d4 p:U f:FI | son,sons | high
DAUGHTER | B @jaw p:D f:F > @neutral:d2 p:U ~arc:f4 d:0.4 | B @neutral:d4 p:U f:FI | daughter,daughters | high
CHILD | B @low:o4 p:D f:F > @low:o14 ~tap:3 d:0.35 | child,children,kids,offspring | high
BABY | B @neutral:o4 p:U f:FI > @neutral:o4 ~twist:20 h:0.4 | B @neutral:d3 p:U f:FO | baby,infant | high
MARRY | curvedB @neutral:u4 p:D f:F > @base.back:u2 d:0.3 | curvedB @neutral p:U f:F | marry,married,spouse | high
WIFE | =WOMAN+MARRY | wife,wives | high
HUSBAND | =MAN+MARRY | husband | high
FAMILY | F @neutral:o3f6 p:F f:U > @neutral:o3f6 p:B ~arc:f10o8 d:0.45 ;sym | family,relatives,kin,kindred | high
FRIEND | X @neutral:u2 p:D f:FI > p:U d:0.2 | X @neutral p:U f:FO | friend,companion,ally | high
GROUP | C @neutral:o3f6 p:F f:U > @neutral:o3f6 p:B ~arc:f10o8 d:0.45 ;sym | group,party,company,crowd,band | high
ORPHAN | =CHILD+ALONE | orphan | med
POOR | 5 @base.wrist:b20 p:B f:U > flatO @base.wrist:b20d6 d:0.25 ;x2 | B @neutral:o4 p:D f:FI | poor,needy,poverty | med
RICH | S @base.palm:u2 p:U f:F > claw5 @base.palm:u14 p:D f:F d:0.35 | B @neutral p:U f:FI | rich,wealthy,self-sufficient | high
SERVE | B @neutral:o8 p:U f:F > @neutral:o8f8 d:0.2 ;alt x2 | serve,service | high
SERVANT | =SERVE+PERSON | servant,servants,slave | high
KING | K @^shoulder p:B f:U > @hip:f6 d:0.45 | king,sovereign,ruler | high
LEADER | =LEAD+PERSON | leader | med

# ---------- emotion & mind ----------
KNOW | B @temple p:B f:IU at:tipM > @temple:o3 d:0.1 ;x2 | know,knew,knowing,knowledge,aware | high
NOT-KNOW | B @temple p:B f:IU at:tipM > @forehead:o10f12 p:F d:0.25 ;face:shake=0.1 | do not know | high
THINK | 1 @temple p:B f:IU at:tipI > @temple:o3 d:0.1 ;x2 | think,thought,consider,suppose,reckon | high
UNDERSTAND | S @temple:f4 p:B f:U > 1 d:0.18 | understand,comprehend,realize | high
REMEMBER | 10 @forehead:o3 p:I f:F at:tipT > @neutral:u2 at:tipT d:0.4 | 10 @neutral p:I f:F | remember,remembrance,mention,recall,reminder | high
FORGET | B @forehead:i4 p:B f:O > A @forehead:o12 d:0.3 | forget,forgot,neglect | high
LEARN | 5 @base.palm:u4 p:D f:F > flatO @forehead:f4 p:B f:U d:0.4 | B @neutral p:U f:FI | learn,study | high
TEACH | flatO @forehead:o6f6 p:F f:U > @forehead:o6f18 d:0.2 ;sym x2 | teach,taught,instruct | high
WISE | X @forehead:f5 p:I f:F > @forehead:f5d3 d:0.12 ;x2 | wise,wisdom | high
FOOL | X @forehead:f4 p:I f:U > ~twist:30 | fool,foolish | low
MIND | 1 @temple p:B f:IU at:tipI ~tap:1 | mind,intellect,reason,intelligent | high
BELIEVE | 1 @temple p:B f:IU at:tipI > curvedB @neutral:u2 p:D f:F d:0.4 | curvedB @neutral p:U f:F | believe,belief,faith,believer,believers | high
DOUBT | bentV @eyes:f8 p:D f:F > @eyes:f8 ~shake:1 h:0.3 | doubt,uncertain,suspicion | med
FEEL | open8 @chest p:B f:U at:tipM > @chest:u4 d:0.25 | feel,feeling,sense | high
HEART | open8 @heart:f1 p:B f:U at:tipM > @heart:f3 d:0.1 ;x2 | heart,hearts | high
LOVE | S @^chestSide:f2 p:B f:UI > @^chestSide:f3 d:0.2 | S @^chestSide:f5 p:B f:UI > @^chestSide:f6 d:0.2 | love,loving,beloved | high
LIKE | 5 @chest:f1 p:B f:U at:tipM > 8 @chest:f12 d:0.25 | like,enjoy,fond | high
HATE | 8 @neutral:o6f4 p:D f:F > 5 @neutral:o8f12 d:0.15 ;sym | hate,hatred,detest,despise | high
HAPPY | B @chest:d4 p:B f:I > @chest:u6 ~arc:f3 d:0.15 ;x2 face:smile=0.8,browUp=0.3 | happy,glad,joy,joyful,rejoice,delight | high
SAD | 5 @eyes:o5f8 p:B f:U > @chin:o6f8d8 d:0.45 ;sym face:browInnerUp=0.9,frown=0.6 | sad,grief,grieve,sorrow | high
ANGRY | claw5 @stomach:o7f3 p:B f:I > @chestHigh:o7f4 d:0.35 ;sym face:browDown=1,squint=0.5,frown=0.6 | angry,anger,wrath,rage,furious | high
AFRAID | S @chestSide:f8 p:B f:I > 5 @chest:f8o2 d:0.12 ;sym face:eyesWide=0.8,browInnerUp=0.6 | afraid,fear,scared,terror,dread | high
WORRY | B @face:o8f8 p:B f:I ~circle:B5x2 ;alt face:browInnerUp=0.6,browDown=0.3 | worry,anxious,anxiety | med
PLEASED | B @chest:o4f6u6 p:D f:I > @chest:o4f6d2 d:0.3 ;sym face:smile=0.5 | pleased,satisfied,content,satisfaction | high
ENJOY | B @chest p:B f:I ~circle:B5x2 ;face:smile=0.5 | enjoy,enjoyment,pleasure,please | high
PATIENT | A @lips p:I f:U at:tipT > @chin:d4 at:tipT d:0.4 | patient,patience,steadfast,persevere,endure | high
THANK | B @chin p:B f:U at:tipM > @neutral:f12 p:U f:F d:0.3 | thank,thanks,grateful,gratitude,thankful | high
PROUD | A @stomach p:B f:D at:tipT > @chestHigh at:tipT d:0.35 ;face:browUp=0.3 | proud,arrogant,arrogance,boast | med
HUMBLE | B @chin:f4 p:I f:U at:radial > @base.palm:d4 d:0.35 | B @neutral p:D f:FI | humble,humbled,humility,submissive | med
SORRY | A @chest:o2 p:B f:U ~circle:F5x2 ;face:browInnerUp=0.6 | sorry,regret,apologize | high
REGRET | =SORRY | regret,remorse | high
JEALOUS | I @mouth:o3 p:B f:U at:tipP ~twist:40 | jealous,envy,envious,envier | high
SURPRISE | baby0 @eyes:o4f3 p:F f:U > L @eyes:o6f4 d:0.12 ;sym face:eyesWide=1,browUp=1 | surprise,amazed,astonished | high
CRY | 1 @eye:d2 p:B f:U at:tipI > @cheek:d6 at:tipI d:0.25 ;sym x2 face:browInnerUp=0.8,frown=0.5 | cry,weep,tears | high
LAUGH | 1 @mouth:o4 p:B f:I at:tipI > @cheek:o6u2 at:tipI d:0.15 ;sym x2 face:smile=1,mouthOpen=0.5 | laugh,laughing | high
HOPE | B @forehead:o8f4 p:F f:U > bentB d:0.15 ;x2 | B @neutral:u8f8 p:I f:U > bentB d:0.15 | hope,expect,wish | med
WANT | claw5 @far p:U f:F > @neutral:b4 d:0.3 ;sym | want,desire,will,wish | high
NEED | X @neutral:u4 p:D f:F > @neutral:d2 d:0.12 ;x2 | need,must,should | high
MUST | X @neutral:u6 p:D f:F > @neutral:d4 d:0.2 | must,obligated | high
CAN | S @neutral:o6u4 p:D f:F > @neutral:o6d4 d:0.2 ;sym | can,able,ability,could,capable,power | high
CANNOT | 1 @neutral:u6o4 p:D f:FI > @neutral:d4o0 d:0.2 | 1 @neutral p:D f:FO | cannot,can not,unable | high
TRY | S @neutral:o8 p:I f:F > @far:o8 ~arc:d4 d:0.35 ;sym | try,strive,effort,attempt,struggle | high
DECIDE | 1 @temple p:B f:IU at:tipI > F @neutral:o6 p:I f:F d:0.35 | F @neutral:u6 p:I f:F > @neutral:u0 d:0.35 | decide,decision,decree,determine | high
CHOOSE | F @far p:D f:F > @neutral:b2 d:0.3 | choose,chose,select,prefer | high
PROMISE | 1 @lips:f1 p:I f:U at:tipI > B @base.back:u2 p:D f:F d:0.35 | S @neutral p:I f:F | promise,promised,vow,covenant | high
SWEAR | 1 @lips:f1 p:I f:U at:tipI > B @face:o14f6 p:F f:U d:0.35 | swear,oath | high | oath formula "By the ..."
`;
