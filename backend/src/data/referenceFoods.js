// Reference nutrition data — same ~100 common foods used in the Nourish
// frontend demo, shaped for seeding the `foods` table via NutritionProvider.
// Swap/extend this module (or point NutritionProvider at a licensed API)
// without touching any route or service code.
'use strict';

const REFERENCE_FOODS = [

{id:"rice_white_cooked",name:"Rice, white, cooked",cat:"Grains",per100:{cal:130,p:2.7,c:28,f:0.3,fib:0.4,sug:0.1,sat:0.1,sod:1},serving:{qty:1,unit:"bowl",grams:180,label:"1 bowl (~180g)"}},
{id:"rice_brown_cooked",name:"Rice, brown, cooked",cat:"Grains",per100:{cal:123,p:2.7,c:26,f:1,fib:1.8,sug:0.4,sat:0.2,sod:4},serving:{qty:1,unit:"bowl",grams:180,label:"1 bowl (~180g)"}},
{id:"roti_wheat",name:"Roti / chapati",cat:"Grains",per100:{cal:297,p:9.7,c:59,f:3.7,fib:9.6,sug:1.6,sat:0.8,sod:390},serving:{qty:1,unit:"piece",grams:40,label:"1 medium roti (~40g)"}},
{id:"naan",name:"Naan bread",cat:"Grains",per100:{cal:310,p:9,c:50,f:8,fib:2.2,sug:3.6,sat:2.6,sod:520},serving:{qty:1,unit:"piece",grams:90,label:"1 piece (~90g)"}},
{id:"bread_white",name:"Bread, white",cat:"Grains",per100:{cal:265,p:9,c:49,f:3.2,fib:2.7,sug:5,sat:0.7,sod:490},serving:{qty:1,unit:"slice",grams:30,label:"1 slice (~30g)"}},
{id:"bread_wheat",name:"Bread, whole wheat",cat:"Grains",per100:{cal:247,p:13,c:41,f:3.4,fib:7,sug:5.6,sat:0.6,sod:450},serving:{qty:1,unit:"slice",grams:32,label:"1 slice (~32g)"}},
{id:"oats_dry",name:"Oats, rolled, dry",cat:"Grains",per100:{cal:389,p:16.9,c:66,f:6.9,fib:10.6,sug:0,sat:1.2,sod:2},serving:{qty:40,unit:"g",grams:40,label:"40g (~1/2 cup dry)"}},
{id:"poha_cooked",name:"Poha (flattened rice), cooked",cat:"Grains",per100:{cal:130,p:2.5,c:27,f:1.8,fib:0.6,sug:1,sat:0.3,sod:210},serving:{qty:1,unit:"bowl",grams:150,label:"1 bowl (~150g)"}},
{id:"idli",name:"Idli",cat:"Grains",per100:{cal:135,p:4,c:28,f:0.4,fib:1.4,sug:0.3,sat:0.1,sod:290},serving:{qty:2,unit:"piece",grams:80,label:"2 pieces (~80g)"}},
{id:"dosa_plain",name:"Dosa, plain",cat:"Grains",per100:{cal:168,p:3.9,c:28,f:4.4,fib:1,sug:0.5,sat:0.7,sod:280},serving:{qty:1,unit:"piece",grams:90,label:"1 medium dosa (~90g)"}},
{id:"pasta_cooked",name:"Pasta, cooked",cat:"Grains",per100:{cal:158,p:5.8,c:31,f:0.9,fib:1.8,sug:0.6,sat:0.2,sod:1},serving:{qty:1,unit:"bowl",grams:180,label:"1 bowl (~180g)"}},
{id:"quinoa_cooked",name:"Quinoa, cooked",cat:"Grains",per100:{cal:120,p:4.4,c:21,f:1.9,fib:2.8,sug:0.9,sat:0.2,sod:7},serving:{qty:1,unit:"bowl",grams:170,label:"1 bowl (~170g)"}},
{id:"cornflakes",name:"Corn flakes cereal",cat:"Grains",per100:{cal:378,p:7,c:84,f:0.9,fib:3,sug:8,sat:0.2,sod:660},serving:{qty:30,unit:"g",grams:30,label:"30g (~1 cup)"}},

{id:"dal_cooked",name:"Dal (lentil curry), cooked",cat:"Legumes",per100:{cal:104,p:6.4,c:16,f:1.8,fib:4.3,sug:1.5,sat:0.3,sod:310},serving:{qty:1,unit:"bowl",grams:200,label:"1 bowl (~200g)"}},
{id:"chana_cooked",name:"Chickpea curry (chana)",cat:"Legumes",per100:{cal:150,p:7.6,c:20,f:4.5,fib:6,sug:2,sat:0.6,sod:340},serving:{qty:1,unit:"bowl",grams:200,label:"1 bowl (~200g)"}},
{id:"rajma_cooked",name:"Kidney bean curry (rajma)",cat:"Legumes",per100:{cal:127,p:7.5,c:18,f:2.6,fib:5.8,sug:1.8,sat:0.5,sod:320},serving:{qty:1,unit:"bowl",grams:200,label:"1 bowl (~200g)"}},
{id:"chickpeas_boiled",name:"Chickpeas, boiled",cat:"Legumes",per100:{cal:164,p:8.9,c:27,f:2.6,fib:7.6,sug:4.8,sat:0.3,sod:7},serving:{qty:100,unit:"g",grams:100,label:"100g"}},
{id:"lentils_boiled",name:"Lentils, boiled",cat:"Legumes",per100:{cal:116,p:9,c:20,f:0.4,fib:7.9,sug:1.8,sat:0.1,sod:2},serving:{qty:100,unit:"g",grams:100,label:"100g"}},
{id:"tofu",name:"Tofu, firm",cat:"Legumes",per100:{cal:144,p:15.8,c:2.8,f:8.7,fib:2.3,sug:0.6,sat:1.3,sod:12},serving:{qty:100,unit:"g",grams:100,label:"100g"}},
{id:"soy_chunks_cooked",name:"Soy chunks, cooked",cat:"Legumes",per100:{cal:116,p:16.5,c:9,f:0.6,fib:5,sug:2,sat:0.1,sod:280},serving:{qty:100,unit:"g",grams:100,label:"100g"}},
{id:"paneer",name:"Paneer",cat:"Dairy",per100:{cal:265,p:18.3,c:3.6,f:20.8,fib:0,sug:2.6,sat:13,sod:22},serving:{qty:100,unit:"g",grams:100,label:"100g"}},

{id:"milk_whole",name:"Milk, whole",cat:"Dairy",per100:{cal:61,p:3.2,c:4.8,f:3.3,fib:0,sug:5.1,sat:1.9,sod:43},serving:{qty:1,unit:"cup",grams:240,label:"1 cup (~240ml)"}},
{id:"milk_skim",name:"Milk, skim",cat:"Dairy",per100:{cal:34,p:3.4,c:5,f:0.1,fib:0,sug:5,sat:0.1,sod:44},serving:{qty:1,unit:"cup",grams:240,label:"1 cup (~240ml)"}},
{id:"curd_plain",name:"Curd / plain yogurt",cat:"Dairy",per100:{cal:60,p:3.5,c:4.7,f:3.3,fib:0,sug:4.7,sat:2.1,sod:36},serving:{qty:1,unit:"bowl",grams:150,label:"1 bowl (~150g)"}},
{id:"yogurt_greek",name:"Greek yogurt, plain",cat:"Dairy",per100:{cal:59,p:10,c:3.6,f:0.4,fib:0,sug:3.6,sat:0.1,sod:36},serving:{qty:150,unit:"g",grams:150,label:"150g"}},
{id:"cheese_cheddar",name:"Cheddar cheese",cat:"Dairy",per100:{cal:403,p:25,c:1.3,f:33,fib:0,sug:0.5,sat:21,sod:653},serving:{qty:1,unit:"slice",grams:20,label:"1 slice (~20g)"}},
{id:"butter",name:"Butter",cat:"Dairy",per100:{cal:717,p:0.9,c:0.1,f:81,fib:0,sug:0.1,sat:51,sod:11},serving:{qty:1,unit:"tsp",grams:5,label:"1 tsp (~5g)"}},
{id:"ghee",name:"Ghee",cat:"Dairy",per100:{cal:900,p:0,c:0,f:100,fib:0,sug:0,sat:62,sod:0},serving:{qty:1,unit:"tsp",grams:5,label:"1 tsp (~5g)"}},

{id:"egg_boiled",name:"Egg, boiled",cat:"Protein",per100:{cal:155,p:13,c:1.1,f:11,fib:0,sug:1.1,sat:3.3,sod:124},serving:{qty:1,unit:"piece",grams:50,label:"1 large egg (~50g)"}},
{id:"egg_fried",name:"Egg, fried",cat:"Protein",per100:{cal:196,p:13.6,c:0.8,f:15,fib:0,sug:0.4,sat:3.3,sod:207},serving:{qty:1,unit:"piece",grams:50,label:"1 egg (~50g)"}},
{id:"chicken_breast_cooked",name:"Chicken breast, cooked",cat:"Protein",per100:{cal:165,p:31,c:0,f:3.6,fib:0,sug:0,sat:1,sod:74},serving:{qty:100,unit:"g",grams:100,label:"100g"}},
{id:"chicken_curry",name:"Chicken curry",cat:"Protein",per100:{cal:172,p:14,c:5.6,f:10.5,fib:1.2,sug:2,sat:2.8,sod:380},serving:{qty:1,unit:"bowl",grams:220,label:"1 bowl (~220g)"}},
{id:"mutton_curry",name:"Mutton curry",cat:"Protein",per100:{cal:210,p:16,c:5,f:14,fib:1,sug:1.8,sat:5,sod:400},serving:{qty:1,unit:"bowl",grams:220,label:"1 bowl (~220g)"}},
{id:"fish_grilled",name:"Fish, grilled (generic)",cat:"Protein",per100:{cal:150,p:24,c:0,f:5.4,fib:0,sug:0,sat:1.3,sod:70},serving:{qty:100,unit:"g",grams:100,label:"100g"}},
{id:"salmon_cooked",name:"Salmon, cooked",cat:"Protein",per100:{cal:208,p:22,c:0,f:13,fib:0,sug:0,sat:3.1,sod:59},serving:{qty:100,unit:"g",grams:100,label:"100g"}},
{id:"shrimp_cooked",name:"Shrimp, cooked",cat:"Protein",per100:{cal:99,p:24,c:0.2,f:0.3,fib:0,sug:0,sat:0.1,sod:111},serving:{qty:100,unit:"g",grams:100,label:"100g"}},
{id:"beef_cooked",name:"Beef, lean, cooked",cat:"Protein",per100:{cal:217,p:26,c:0,f:12,fib:0,sug:0,sat:4.6,sod:60},serving:{qty:100,unit:"g",grams:100,label:"100g"}},
{id:"turkey_cooked",name:"Turkey breast, cooked",cat:"Protein",per100:{cal:135,p:30,c:0,f:1,fib:0,sug:0,sat:0.3,sod:60},serving:{qty:100,unit:"g",grams:100,label:"100g"}},
{id:"whey_protein",name:"Whey protein powder",cat:"Protein",per100:{cal:400,p:80,c:8,f:6,fib:1,sug:4,sat:2,sod:200},serving:{qty:30,unit:"g",grams:30,label:"1 scoop (~30g)"}},

{id:"almonds",name:"Almonds",cat:"Nuts & seeds",per100:{cal:579,p:21,c:22,f:50,fib:12.5,sug:4.4,sat:3.8,sod:1},serving:{qty:10,unit:"piece",grams:12,label:"10 almonds (~12g)"}},
{id:"walnuts",name:"Walnuts",cat:"Nuts & seeds",per100:{cal:654,p:15,c:14,f:65,fib:6.7,sug:2.6,sat:6.1,sod:2},serving:{qty:4,unit:"piece",grams:16,label:"4 halves (~16g)"}},
{id:"peanuts",name:"Peanuts, roasted",cat:"Nuts & seeds",per100:{cal:567,p:26,c:16,f:49,fib:8.5,sug:4,sat:6.8,sod:18},serving:{qty:30,unit:"g",grams:30,label:"30g (small handful)"}},
{id:"peanut_butter",name:"Peanut butter",cat:"Nuts & seeds",per100:{cal:588,p:25,c:20,f:50,fib:6,sug:9,sat:10,sod:459},serving:{qty:1,unit:"tbsp",grams:16,label:"1 tbsp (~16g)"}},
{id:"chia_seeds",name:"Chia seeds",cat:"Nuts & seeds",per100:{cal:486,p:17,c:42,f:31,fib:34,sug:0,sat:3.3,sod:16},serving:{qty:1,unit:"tbsp",grams:12,label:"1 tbsp (~12g)"}},
{id:"cashews",name:"Cashews",cat:"Nuts & seeds",per100:{cal:553,p:18,c:30,f:44,fib:3.3,sug:5.9,sat:7.8,sod:12},serving:{qty:10,unit:"piece",grams:14,label:"10 cashews (~14g)"}},

{id:"banana",name:"Banana",cat:"Fruits",per100:{cal:89,p:1.1,c:23,f:0.3,fib:2.6,sug:12,sat:0.1,sod:1},serving:{qty:1,unit:"piece",grams:118,label:"1 medium (~118g)"}},
{id:"apple",name:"Apple",cat:"Fruits",per100:{cal:52,p:0.3,c:14,f:0.2,fib:2.4,sug:10,sat:0,sod:1},serving:{qty:1,unit:"piece",grams:182,label:"1 medium (~182g)"}},
{id:"orange",name:"Orange",cat:"Fruits",per100:{cal:47,p:0.9,c:12,f:0.1,fib:2.4,sug:9.4,sat:0,sod:0},serving:{qty:1,unit:"piece",grams:130,label:"1 medium (~130g)"}},
{id:"mango",name:"Mango",cat:"Fruits",per100:{cal:60,p:0.8,c:15,f:0.4,fib:1.6,sug:14,sat:0.1,sod:1},serving:{qty:1,unit:"cup",grams:165,label:"1 cup sliced (~165g)"}},
{id:"grapes",name:"Grapes",cat:"Fruits",per100:{cal:69,p:0.7,c:18,f:0.2,fib:0.9,sug:16,sat:0.1,sod:2},serving:{qty:1,unit:"cup",grams:150,label:"1 cup (~150g)"}},
{id:"papaya",name:"Papaya",cat:"Fruits",per100:{cal:43,p:0.5,c:11,f:0.3,fib:1.7,sug:7.8,sat:0.1,sod:8},serving:{qty:1,unit:"cup",grams:145,label:"1 cup (~145g)"}},
{id:"watermelon",name:"Watermelon",cat:"Fruits",per100:{cal:30,p:0.6,c:7.6,f:0.2,fib:0.4,sug:6.2,sat:0,sod:1},serving:{qty:1,unit:"cup",grams:150,label:"1 cup (~150g)"}},
{id:"strawberries",name:"Strawberries",cat:"Fruits",per100:{cal:32,p:0.7,c:7.7,f:0.3,fib:2,sug:4.9,sat:0,sod:1},serving:{qty:1,unit:"cup",grams:150,label:"1 cup (~150g)"}},
{id:"avocado",name:"Avocado",cat:"Fruits",per100:{cal:160,p:2,c:8.5,f:14.7,fib:6.7,sug:0.7,sat:2.1,sod:7},serving:{qty:0.5,unit:"piece",grams:100,label:"1/2 avocado (~100g)"}},
{id:"dates",name:"Dates",cat:"Fruits",per100:{cal:282,p:2.5,c:75,f:0.4,fib:8,sug:63,sat:0,sod:2},serving:{qty:3,unit:"piece",grams:24,label:"3 dates (~24g)"}},

{id:"potato_boiled",name:"Potato, boiled",cat:"Vegetables",per100:{cal:87,p:1.9,c:20,f:0.1,fib:1.8,sug:0.9,sat:0,sod:6},serving:{qty:1,unit:"piece",grams:150,label:"1 medium (~150g)"}},
{id:"sweet_potato",name:"Sweet potato, roasted",cat:"Vegetables",per100:{cal:90,p:2,c:21,f:0.1,fib:3.3,sug:6.5,sat:0,sod:36},serving:{qty:1,unit:"piece",grams:130,label:"1 medium (~130g)"}},
{id:"mixed_veg_curry",name:"Mixed vegetable curry",cat:"Vegetables",per100:{cal:95,p:2.4,c:11,f:5,fib:3,sug:4,sat:1,sod:300},serving:{qty:1,unit:"bowl",grams:180,label:"1 bowl (~180g)"}},
{id:"salad_greens",name:"Green salad (mixed)",cat:"Vegetables",per100:{cal:20,p:1.4,c:3.8,f:0.2,fib:1.8,sug:1.8,sat:0,sod:12},serving:{qty:1,unit:"bowl",grams:120,label:"1 bowl (~120g)"}},
{id:"broccoli_steamed",name:"Broccoli, steamed",cat:"Vegetables",per100:{cal:35,p:2.4,c:7.2,f:0.4,fib:3.3,sug:1.4,sat:0,sod:33},serving:{qty:100,unit:"g",grams:100,label:"100g"}},
{id:"spinach_cooked",name:"Spinach, cooked (saag)",cat:"Vegetables",per100:{cal:58,p:3.6,c:5,f:3.2,fib:2.6,sug:0.8,sat:0.6,sod:280},serving:{qty:1,unit:"bowl",grams:150,label:"1 bowl (~150g)"}},
{id:"carrot_raw",name:"Carrot, raw",cat:"Vegetables",per100:{cal:41,p:0.9,c:9.6,f:0.2,fib:2.8,sug:4.7,sat:0,sod:69},serving:{qty:1,unit:"piece",grams:61,label:"1 medium (~61g)"}},
{id:"tomato",name:"Tomato",cat:"Vegetables",per100:{cal:18,p:0.9,c:3.9,f:0.2,fib:1.2,sug:2.6,sat:0,sod:5},serving:{qty:1,unit:"piece",grams:123,label:"1 medium (~123g)"}},
{id:"cucumber",name:"Cucumber",cat:"Vegetables",per100:{cal:15,p:0.7,c:3.6,f:0.1,fib:0.5,sug:1.7,sat:0,sod:2},serving:{qty:100,unit:"g",grams:100,label:"100g"}},
{id:"corn_boiled",name:"Corn, boiled",cat:"Vegetables",per100:{cal:96,p:3.4,c:21,f:1.5,fib:2.4,sug:4.5,sat:0.2,sod:15},serving:{qty:1,unit:"cup",grams:150,label:"1 cup (~150g)"}},

{id:"olive_oil",name:"Olive oil",cat:"Fats & oils",per100:{cal:884,p:0,c:0,f:100,fib:0,sug:0,sat:14,sod:2},serving:{qty:1,unit:"tsp",grams:5,label:"1 tsp (~5g)"}},
{id:"cooking_oil",name:"Cooking oil (generic)",cat:"Fats & oils",per100:{cal:884,p:0,c:0,f:100,fib:0,sug:0,sat:16,sod:0},serving:{qty:1,unit:"tsp",grams:5,label:"1 tsp (~5g)"}},

{id:"chai_milk_sugar",name:"Tea with milk & sugar",cat:"Beverages",per100:{cal:52,p:1.2,c:8,f:1.5,fib:0,sug:7,sat:0.9,sod:14},serving:{qty:1,unit:"cup",grams:150,label:"1 cup (~150ml)"}},
{id:"coffee_black",name:"Coffee, black",cat:"Beverages",per100:{cal:2,p:0.1,c:0,f:0,fib:0,sug:0,sat:0,sod:2},serving:{qty:1,unit:"cup",grams:200,label:"1 cup (~200ml)"}},
{id:"coffee_latte",name:"Coffee latte",cat:"Beverages",per100:{cal:45,p:2.9,c:4.3,f:1.8,fib:0,sug:4.3,sat:1.1,sod:38},serving:{qty:1,unit:"cup",grams:240,label:"1 cup (~240ml)"}},
{id:"orange_juice",name:"Orange juice",cat:"Beverages",per100:{cal:45,p:0.7,c:10.4,f:0.2,fib:0.2,sug:8.3,sat:0,sod:1},serving:{qty:1,unit:"cup",grams:240,label:"1 cup (~240ml)"}},
{id:"soda_cola",name:"Cola (soft drink)",cat:"Beverages",per100:{cal:42,p:0,c:10.6,f:0,fib:0,sug:10.6,sat:0,sod:4},serving:{qty:330,unit:"ml",grams:330,label:"1 can (330ml)"}},
{id:"protein_shake",name:"Protein shake (milk + whey)",cat:"Beverages",per100:{cal:75,p:8,c:5,f:2.2,fib:0.2,sug:4,sat:1,sod:60},serving:{qty:1,unit:"cup",grams:300,label:"1 shake (~300ml)"}},
{id:"coconut_water",name:"Coconut water",cat:"Beverages",per100:{cal:19,p:0.7,c:3.7,f:0.2,fib:1.1,sug:2.6,sat:0.2,sod:105},serving:{qty:1,unit:"cup",grams:240,label:"1 cup (~240ml)"}},

{id:"samosa",name:"Samosa",cat:"Snacks",per100:{cal:262,p:4.6,c:28,f:15,fib:2.4,sug:1.5,sat:5.6,sod:420},serving:{qty:1,unit:"piece",grams:60,label:"1 piece (~60g)"}},
{id:"french_fries",name:"French fries",cat:"Snacks",per100:{cal:312,p:3.4,c:41,f:15,fib:3.8,sug:0.3,sat:2.3,sod:210},serving:{qty:1,unit:"bowl",grams:110,label:"1 regular serving (~110g)"}},
{id:"potato_chips",name:"Potato chips",cat:"Snacks",per100:{cal:536,p:6.6,c:53,f:35,fib:4.4,sug:0.5,sat:11,sod:525},serving:{qty:30,unit:"g",grams:30,label:"1 small pack (~30g)"}},
{id:"biscuit_cream",name:"Cream biscuits",cat:"Snacks",per100:{cal:495,p:5.7,c:68,f:22,fib:1.6,sug:32,sat:11,sod:230},serving:{qty:2,unit:"piece",grams:20,label:"2 biscuits (~20g)"}},
{id:"chocolate_bar",name:"Milk chocolate",cat:"Snacks",per100:{cal:535,p:7.6,c:59,f:30,fib:3.4,sug:52,sat:18,sod:79},serving:{qty:1,unit:"piece",grams:40,label:"1 bar (~40g)"}},
{id:"popcorn",name:"Popcorn, plain, air-popped",cat:"Snacks",per100:{cal:387,p:13,c:78,f:4.5,fib:14.5,sug:0.9,sat:0.6,sod:8},serving:{qty:1,unit:"bowl",grams:25,label:"1 bowl (~25g)"}},
{id:"granola_bar",name:"Granola bar",cat:"Snacks",per100:{cal:471,p:10,c:64,f:20,fib:5.5,sug:29,sat:6,sod:210},serving:{qty:1,unit:"piece",grams:35,label:"1 bar (~35g)"}},

{id:"pizza_cheese",name:"Cheese pizza",cat:"Fast food",per100:{cal:266,p:11,c:33,f:10,fib:2.3,sug:3.6,sat:4.5,sod:598},serving:{qty:1,unit:"slice",grams:107,label:"1 slice (~107g)"}},
{id:"burger_chicken",name:"Chicken burger",cat:"Fast food",per100:{cal:250,p:14,c:24,f:11,fib:1.5,sug:4,sat:3,sod:520},serving:{qty:1,unit:"piece",grams:180,label:"1 burger (~180g)"}},
{id:"fried_chicken",name:"Fried chicken",cat:"Fast food",per100:{cal:246,p:20,c:8,f:15,fib:0.3,sug:0,sat:4,sod:480},serving:{qty:100,unit:"g",grams:100,label:"100g (1 piece)"}},
{id:"noodles_fried",name:"Fried noodles / chow mein",cat:"Fast food",per100:{cal:172,p:5.2,c:24,f:6.5,fib:1.8,sug:2.5,sat:1.1,sod:520},serving:{qty:1,unit:"bowl",grams:220,label:"1 bowl (~220g)"}},
{id:"butter_chicken",name:"Butter chicken",cat:"Fast food",per100:{cal:190,p:13,c:6,f:13,fib:1,sug:3,sat:6,sod:430},serving:{qty:1,unit:"bowl",grams:200,label:"1 bowl (~200g)"}},
{id:"biryani_chicken",name:"Chicken biryani",cat:"Fast food",per100:{cal:165,p:8,c:19,f:6,fib:1,sug:1,sat:1.8,sod:380},serving:{qty:1,unit:"bowl",grams:250,label:"1 plate (~250g)"}},

{id:"besan_chilla",name:"Besan chilla (batter, raw)",cat:"Custom",per100:{cal:387,p:22,c:57,f:6.7,fib:11,sug:9,sat:0.7,sod:11},serving:{qty:100,unit:"g",grams:100,label:"100g raw besan"}},
{id:"honey",name:"Honey",cat:"Condiments",per100:{cal:304,p:0.3,c:82,f:0,fib:0.2,sug:82,sat:0,sod:4},serving:{qty:1,unit:"tbsp",grams:21,label:"1 tbsp (~21g)"}},
{id:"jam",name:"Fruit jam",cat:"Condiments",per100:{cal:250,p:0.4,c:65,f:0.1,fib:1,sug:52,sat:0,sod:15},serving:{qty:1,unit:"tbsp",grams:20,label:"1 tbsp (~20g)"}},
{id:"ketchup",name:"Tomato ketchup",cat:"Condiments",per100:{cal:112,p:1.2,c:26,f:0.2,fib:0.4,sug:23,sat:0,sod:900},serving:{qty:1,unit:"tbsp",grams:17,label:"1 tbsp (~17g)"}},
{id:"mayonnaise",name:"Mayonnaise",cat:"Condiments",per100:{cal:680,p:1,c:1.5,f:75,fib:0,sug:1.2,sat:11,sod:590},serving:{qty:1,unit:"tbsp",grams:14,label:"1 tbsp (~14g)"}},
];

module.exports = { REFERENCE_FOODS };
