// Nature, cosmos, animals, plants, places and objects.
export const LEX_NATURE = String.raw`
SKY | B @high:i16u16 p:D f:FI > @high:o16u16 ~arc:u6 d:0.5 | sky,heaven,heavens,firmament | high
SUN | 1 @aboveHead:o8 p:F f:U ~circle:F5x1 > 5 @high:o4f8 p:D f:F d:0.35 | sun | high
MOON | smallC @eye:o4f2 p:I f:U at:radial > @aboveHead:o10 d:0.4 | moon | high
STAR | 1 @high:o6 p:F f:U > @aboveHead:o6 d:0.15 ;alt x2 | star,stars,planet,planets | high
LIGHT | flatO @high:f8 p:D f:F > 5 d:0.2 | light,lamp,shine,shining,illuminate | high
BRIGHT | flatO @neutral:o4 p:F f:U > 5 @high:o14 d:0.3 ;sym | bright,brightness,clear,radiant,manifest | high
DARK | B @face:o14f8 p:B f:U > @face:o2f8 d:0.35 ;sym | dark,darkness,gloom | high
EARTH | 8 @base.back p:D f:F ~twist:25 | S @neutral p:D f:FI | earth,land,ground,soil | high
LAND | 5 @low:o6 p:D f:F > @low:o20 d:0.4 ;sym | land,lands,region,country | high
MOUNTAIN | 5 @neutral:o12d4 p:F f:U > @high:o3u4 d:0.45 ;sym | mountain,mountains,hill | med
SEA | B @neutral:o6 p:D f:F > @neutral:o6f8u3 ~arc:u4 d:0.25 ;sym x2 | sea,seas,ocean,waves | high
WATER | W @chin:o1 p:I f:U at:tipI > @chin:f3 at:tipI d:0.1 ;x2 | water | high
FLOW | 5 @neutral:o8b2 p:D f:F > @far:o8 ~wiggle:10 d:0.5 ;sym | flow,flowing,stream,pour | med
RIVER | =WATER+FLOW | river,rivers,stream,streams | high
SPRING | =WATER+APPEAR | spring,fountain,springs | med
RAIN | claw5 @high:o8 p:D f:F > @neutral:o8 d:0.25 ;sym x2 | rain,raining | high
CLOUD | claw5 @high:o10u8 p:F f:U ~circle:F6x1 ;sym | cloud,clouds | high
WIND | 5 @neutral:u8o14 p:I f:U > @neutral:u8i2 ~arc:u4 d:0.35 ;sym x2 | wind,winds,storm,breeze | high
THUNDER | =NOISE+LIGHTNING | thunder | low
LIGHTNING | 1 @aboveHead:o4 p:F f:D > @high:i6 d:0.1 > @neutral:o6 d:0.1 | lightning | high
NOISE | 5 @ear:o4 p:B f:U > @ear:o14 ~shake:2 d:0.3 ;sym | noise,sound,blast,loud | high
TREE | 5 @neutral:o4u12 p:F f:U ~twist:20 | B @neutral:i4 p:D f:FI | tree,trees | high
PLANT | flatO @neutral:d8 p:F f:U > 5 @neutral:u6 d:0.35 | C @neutral p:D f:FI | plant,plants,vegetation,grow,grew | high
GROW | =PLANT | grow,growth,sprout | high
GRASS | claw5 @chin:f4 p:B f:U ~circle:B2x1 | grass,pasture,herbage | med
FLOWER | flatO @nose:o3 p:B f:U at:tipM > @nose:i3 at:tipM d:0.25 | flower,flowers,blossom | high
FRUIT | F @cheek p:I f:U at:tipI ~twist:40 | fruit,fruits | high
GRAPE | claw5 @base.back:u2b4 p:D f:F > @base.back:u2f4 ~tap:2 d:0.4 | B @neutral p:D f:FI | grape,grapes,grapevines | high
SEED | flatO @neutral:o2 p:D f:F > @neutral:o10 ~wiggle:12 d:0.4 | seed,grain,seeds | med
DATE-PALM | =fs:PALM+TREE | palm tree,palm trees,date palm | low
FIG | =fs:FIG | fig | low
OLIVE | =fs:OLIVE | olive,olives | low
ANIMAL | bent5 @chestSide p:B f:I at:tipM > @chestSide:o3 at:tipM d:0.12 ;sym x2 | animal,animals,beast,beasts,cattle,livestock | high
HORSE | U @temple:f2 p:F f:U at:tipT > bentH d:0.1 ;x2 | horse,horses,steed | high
CAMEL | =fs:CAMEL | camel,camels,she-camel | low
ELEPHANT | bentB @nose:f2 p:D f:F at:back > @neutral:d4f18 p:D f:FD ~arc:f6 d:0.45 | elephant | high
BIRD | G @mouth:f2 p:I f:F at:tipI > baby0 d:0.1 ;x2 | bird,birds | high
FISH | B @neutral p:I f:F > @neutral:f6 ~twist:30 d:0.4 | fish,whale | high
INSECT | =fs:BUG | insect,moth,moths | low
DONKEY | B @temple p:F f:U at:heel > bentB d:0.12 ;x2 | donkey,donkeys,ass | high
LION | claw5 @forehead:u4 p:D f:F > @headTop:b8 d:0.4 | lion | high
STONE | S @base.back:u3 p:D f:F > @base.back d:0.1 ;x2 | S @neutral p:D f:FI | stone,stones,rock,rocks | high
IRON | =fs:IRON | iron | low
GOLD | =fs:GOLD | gold | low
SILVER | =fs:SILVER | silver | low
WOOD | B @base.back:u2 p:I f:F > @base.back:u2f6 d:0.12 ;x2 | B @neutral p:D f:FI | wood,firewood,timber | high
DUST | flatO @neutral:o2 p:U f:F > ~wiggle:12 h:0.4 | dust,dirt | med
SMOKE | claw5 @low:o2 p:D f:F ~circle:U5x2 > @high:o2 d:0.4 | claw5 @low:o2d4 p:U f:F | smoke | med
HOUSE | B @high:o3 p:I f:UI > @neutral:o12 p:I f:U d:0.35 > @low:o12 d:0.25 ;sym | house,houses,home,dwelling | high
HOME | flatO @mouth:o4 p:B f:U at:tipM > @cheek:o2 at:tipM d:0.2 | home,abode,return | high
CITY | B @neutral:o2u4 p:I f:UI > @neutral:o8u4 d:0.15 ;sym x2 | city,town,village,cities | med
DOOR | B @neutral:u6 p:F f:U > p:I d:0.2 ;x2 | B @neutral:u6 p:F f:U | door,doors,gate,gates | high
OPEN | B @high:o2 p:D f:F > @high:o16 p:F f:U d:0.4 ;sym | open,opened,split,cleft,break open | med
CLOSE | B @neutral:o14 p:F f:U > @neutral:o3 d:0.25 ;sym | close,closed,shut,sealed | high
PATH | B @neutral:o8 p:I f:F > @far:o6 ~arc:o3 d:0.4 ;sym | path,way,road,route | high
STRAIGHT | B @neutral:u4 p:I f:F > @far:u4 d:0.35 | straight,upright,direct | high
SHIP | curvedB @neutral:o2 p:U f:F > @far:o2 ~arc:u3 d:0.4 ;sym | ship,ships,boat,ark | high
CUP | C @base.palm p:I f:U > @base.palm:u2 d:0.1 ;x2 | B @neutral p:U f:FI | cup,cups,goblet,vessel | high
CHAIR | bentH @base.tipI:u6 p:D f:F > @base.tipI:u1 d:0.2 | H @neutral p:D f:FI | chair,seat,couch,couches | high
SIT | =CHAIR | sit,sat,seated | high
THRONE | =KING+CHAIR | throne,arsh | med
BED | B @cheek:o2 p:I f:U > @cheek:o2 h:0.3 ;face:eyesClosed=0.8 | bed,resting place | med
SPREAD | B @neutral:o2 p:D f:F > @neutral:o20 d:0.4 ;sym | spread,spread out,expanse,flat | high
CARPET | =fs:RUG | carpet,carpets | low
CLOTHES | 5 @chestSide:u6 p:B f:U > @chestSide:d10 d:0.2 ;sym x2 | clothes,clothing,garment,garments,dress,cloak | high
COVER | B @base.back:u8b4 p:D f:F > @base.back:u2 d:0.3 | B @neutral p:D f:FI | cover,covered,covering,wrap,veil | high
ROPE | R @neutral:o2 p:D f:F > @neutral:o14 ~twist:30 d:0.4 ;sym | rope,cord,fiber | low
CHAIN | F @neutral:o2 p:I f:F > @neutral:o8 d:0.15 ;sym x2 | chain,chains,shackle,shackles | low
FOOD | flatO @lips:f2 p:B f:U at:tipM > @lips at:tipM d:0.12 ;x2 | food,eat,ate,meal,provision | high
EAT | =FOOD | eat,ate,eating,consume | high
FEED | flatO @neutral:u8 p:U f:F > @far:u8 d:0.2 ;sym x2 | feed,fed,nourish | high
DRINK | C @chin:f6 p:I f:U > @chin:f3 p:I f:UB d:0.25 | drink,drank,drinking,beverage | high
HUNGRY | C @chest:u4 p:B f:I > @chest:d6 d:0.3 | hunger,hungry,starvation | high
THIRSTY | 1 @neck:u2 p:B f:U at:tipI > @neck:d4 at:tipI d:0.3 | thirst,thirsty | high
MONEY | flatO @base.palm:u4 p:U f:F > @base.palm:u1 d:0.12 ;x2 | B @neutral p:U f:FI | money,wealth,riches,property,possessions | high
SPEND | flatO @base.palm:u2 p:U f:F > 5 @far:u2 d:0.3 | B @neutral p:U f:FI | spend,spent,expend | high
EARN | C @base.palm:f8 p:I f:F > S @base.palm:b4 d:0.3 | B @neutral p:U f:FI | earn,earned,acquire,gain | high
HOT | claw5 @mouth:f3 p:B f:U > @neutral:o10f10 p:D d:0.2 ;face:mouthOpen=0.3 | hot,heat,scorching,boiling | high
COLD | S @chestSide:f10 p:B f:U ~shake:2 ;sym | cold,cool,winter | high
SUMMER | X @forehead:i6 p:D f:I > @forehead:o6 d:0.35 | summer | high
WINTER | =COLD | winter | high
RED | 1 @lips:f1 p:B f:U at:tipI > @chin:d1 at:tipI d:0.15 ;x2 | red | high
WHITE | 5 @chest:f2 p:B f:U > flatO @chest:f12 d:0.3 | white | high
BLACK | 1 @forehead:o4 p:D f:I at:radial > @forehead:i4 at:radial d:0.3 | black | high
GREEN | G @neutral:u6 p:B f:U ~twist:35 | green | high
YELLOW | Y @neutral:u6 p:B f:U ~twist:35 | yellow | high
BLOOD | =RED+FLOW | blood | high
BODY | B @chestSide p:B f:I > @stomach:o8 d:0.3 ;sym | body,bodies | high
FACE | 1 @face:f-8 p:B f:U ~circle:F7x1 | face,faces | high
EYE | 1 @eye:f3 p:I f:B at:tipI | eye,eyes,sight | high
EAR | 1 @ear:f3i2 p:F f:O at:tipI | ear,ears | high
MOUTH | 1 @mouth:f3 p:I f:B at:tipI ~circle:F2x1 | mouth,lips,tongue | high
HAND | B @base.back:u2b4 p:D f:F > @base.back:u2f8 d:0.2 | B @neutral p:D f:FI | hand,hands | high
NECK | B @neck:o2 p:D f:I at:radial ~tap:1 | neck | high
CHEST | 1 @chest:f2 p:I f:B at:tipI | chest,breast,breasts | high
BACK-BODY | 1 @shoulder:u2 p:B f:B at:tipI | back,backbone | med
BONE | X @base.back:u2 p:D f:F at:knuckles > @base.back d:0.1 ;x2 | S @neutral p:D f:FI | bone,bones | low
`;
