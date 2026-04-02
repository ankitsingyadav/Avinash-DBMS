import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── India Location Data ──────────────────────────────────────────────────────
const INDIA_LOCATION_DATA = {
  "Andhra Pradesh": {
    districts: {
      "Anakapalli": ["Anakapalle", "Narsipatnam", "Chodavaram", "Payakaraopeta"],
      "Anantapuramu": ["Anantapur", "Hindupur", "Dharmavaram", "Tadipatri", "Guntakal"],
      "Annamayya": ["Rajampet", "Madanapalle", "Rayachoti"],
      "Bapatla": ["Bapatla", "Chirala", "Repalle"],
      "Chittoor": ["Chittoor", "Puttur", "Nagari", "Palamaner"],
      "Dr. B. R. Ambedkar Konaseema": ["Amalapuram", "Ramachandrapuram", "Mummidivaram"],
      "East Godavari": ["Rajahmundry", "Kovvur", "Rajamundry Rural"],
      "Eluru": ["Eluru", "Jangareddygudem", "Nuzvid"],
      "Guntur": ["Guntur", "Tenali", "Mangalagiri", "Ponnur"],
      "Kakinada": ["Kakinada", "Peddapuram", "Samalkot"],
      "Krishna": ["Vijayawada", "Machilipatnam", "Gudivada", "Avanigadda"],
      "Kurnool": ["Kurnool", "Adoni", "Yemmiganur", "Kodumur"],
      "Nandyal": ["Nandyal", "Atmakur", "Banaganapalle"],
      "NTR": ["Vijayawada", "Tiruvuru", "Jaggayyapeta"],
      "Palnadu": ["Narasaraopet", "Sattenapalle", "Vinukonda"],
      "Parvathipuram Manyam": ["Parvathipuram", "Salur"],
      "Prakasam": ["Ongole", "Markapur", "Chirala"],
      "SPSR Nellore": ["Nellore", "Kavali", "Gudur", "Naidupet"],
      "Sri Sathya Sai": ["Puttaparthi", "Dharmavaram", "Kadiri"],
      "Srikakulam": ["Srikakulam", "Palasa", "Tekkali"],
      "Tirupati": ["Tirupati", "Renigunta", "Srikalahasti", "Puttur"],
      "Visakhapatnam": ["Visakhapatnam", "Gajuwaka", "Bheemunipatnam"],
      "Vizianagaram": ["Vizianagaram", "Bobbili", "Parvathipuram"],
      "West Godavari": ["Bhimavaram", "Tadepalligudem", "Narasapuram"],
      "YSR Kadapa": ["Kadapa", "Proddatur", "Pulivendula", "Jammalamadugu"],
    },
  },
  "Arunachal Pradesh": {
    districts: {
      "Tawang": ["Tawang Town"],
      "West Kameng": ["Bomdila", "Dirang"],
      "East Kameng": ["Seppa"],
      "Pakke-Kessang": ["Lemmi", "Seijosa"],
      "Kurung Kumey": ["Koloriang"],
      "Papum Pare": ["Yupia", "Doimukh"],
      "Lower Subansiri": ["Ziro"],
      "Upper Subansiri": ["Daporijo"],
      "West Siang": ["Aalo"],
      "East Siang": ["Pasighat", "Ruksin"],
      "Upper Siang": ["Yingkiong"],
      "Dibang Valley": ["Anini"],
      "Lower Dibang Valley": ["Roing"],
      "Lohit": ["Tezu"],
      "Namsai": ["Namsai"],
      "Changlang": ["Changlang"],
      "Tirap": ["Khonsa"],
      "Longding": ["Longding"],
      "Itanagar Capital Complex": ["Itanagar", "Naharlagun"],
    },
  },
  "Assam": {
    districts: {
      "Baksa": ["Mushalpur"],
      "Barpeta": ["Barpeta", "Pathsala"],
      "Biswanath": ["Biswanath Chariali"],
      "Bongaigaon": ["Bongaigaon"],
      "Cachar": ["Silchar", "Sonai", "Lakhipur"],
      "Charaideo": ["Sonari"],
      "Darrang": ["Mangaldoi", "Sipajhar"],
      "Dhemaji": ["Dhemaji"],
      "Dhubri": ["Dhubri", "Bilasipara", "Chapar"],
      "Dibrugarh": ["Dibrugarh", "Naharkatia", "Duliajan"],
      "Dima Hasao": ["Haflong"],
      "Goalpara": ["Goalpara"],
      "Golaghat": ["Golaghat", "Dergaon"],
      "Hailakandi": ["Hailakandi"],
      "Hojai": ["Hojai", "Doboka"],
      "Jorhat": ["Jorhat", "Titabar", "Mariani"],
      "Kamrup": ["Amingaon", "Rangia", "Hajo", "Sualkuchi"],
      "Kamrup Metropolitan": ["Guwahati", "Dispur", "Jalukbari", "Azara"],
      "Karbi Anglong": ["Diphu"],
      "Karimganj": ["Karimganj", "Badarpur"],
      "Kokrajhar": ["Kokrajhar"],
      "Lakhimpur": ["North Lakhimpur"],
      "Majuli": ["Garamur"],
      "Morigaon": ["Morigaon"],
      "Nagaon": ["Nagaon", "Lumding", "Raha", "Dhing"],
      "Nalbari": ["Nalbari"],
      "Sivasagar": ["Sivasagar"],
      "Sonitpur": ["Tezpur", "Dhekiajuli"],
      "Tinsukia": ["Tinsukia", "Digboi", "Doom Dooma", "Margherita"],
      "Udalguri": ["Udalguri"],
      "West Karbi Anglong": ["Hamren"],
    },
  },
  "Bihar": {
    districts: {
      "Araria": ["Araria"],
      "Arwal": ["Arwal"],
      "Aurangabad": ["Aurangabad"],
      "Banka": ["Banka"],
      "Begusarai": ["Begusarai"],
      "Bhagalpur": ["Bhagalpur", "Kahalgaon"],
      "Bhojpur": ["Arrah"],
      "Buxar": ["Buxar"],
      "Darbhanga": ["Darbhanga"],
      "East Champaran": ["Motihari"],
      "Gaya": ["Gaya", "Bodh Gaya", "Sherghati"],
      "Gopalganj": ["Gopalganj"],
      "Jamui": ["Jamui"],
      "Jehanabad": ["Jehanabad"],
      "Kaimur": ["Bhabua"],
      "Katihar": ["Katihar"],
      "Khagaria": ["Khagaria"],
      "Kishanganj": ["Kishanganj"],
      "Lakhisarai": ["Lakhisarai"],
      "Madhepura": ["Madhepura"],
      "Madhubani": ["Madhubani"],
      "Munger": ["Munger", "Jamalpur"],
      "Muzaffarpur": ["Muzaffarpur"],
      "Nalanda": ["Bihar Sharif", "Rajgir", "Nalanda"],
      "Nawada": ["Nawada"],
      "Patna": ["Patna", "Danapur", "Phulwarisharif", "Maner"],
      "Purnia": ["Purnia"],
      "Rohtas": ["Sasaram", "Dehri-on-Sone"],
      "Saharsa": ["Saharsa"],
      "Samastipur": ["Samastipur"],
      "Saran": ["Chapra"],
      "Sheikhpura": ["Sheikhpura"],
      "Sheohar": ["Sheohar"],
      "Sitamarhi": ["Sitamarhi"],
      "Siwan": ["Siwan"],
      "Supaul": ["Supaul"],
      "Vaishali": ["Hajipur"],
      "West Champaran": ["Bettiah"],
    },
  },
  "Chhattisgarh": {
    districts: {
      "Balod": ["Balod"],
      "Baloda Bazar-Bhatapara": ["Baloda Bazar", "Bhatapara"],
      "Bastar": ["Jagdalpur"],
      "Bilaspur": ["Bilaspur"],
      "Dhamtari": ["Dhamtari"],
      "Durg": ["Durg", "Bhilai"],
      "Gariaband": ["Gariaband"],
      "Janjgir-Champa": ["Janjgir", "Champa"],
      "Jashpur": ["Jashpur Nagar"],
      "Kabirdham": ["Kawardha"],
      "Kanker": ["Kanker"],
      "Kondagaon": ["Kondagaon"],
      "Korba": ["Korba"],
      "Korea": ["Baikunthpur"],
      "Mahasamund": ["Mahasamund"],
      "Mungeli": ["Mungeli"],
      "Narayanpur": ["Narayanpur"],
      "Raigarh": ["Raigarh"],
      "Raipur": ["Raipur", "Birgaon", "Simga"],
      "Rajnandgaon": ["Rajnandgaon"],
      "Sukma": ["Sukma"],
      "Surajpur": ["Surajpur"],
      "Surguja": ["Ambikapur"],
    },
  },
  "Goa": {
    districts: {
      "North Goa": ["Panaji", "Mapusa", "Ponda", "Bicholim", "Pernem", "Calangute", "Anjuna"],
      "South Goa": ["Margao", "Vasco da Gama", "Quepem", "Sanguem", "Canacona"],
    },
  },
  "Gujarat": {
    districts: {
      "Ahmedabad": ["Ahmedabad", "Sanand", "Viramgam", "Dholka"],
      "Amreli": ["Amreli", "Savarkundla", "Rajula"],
      "Anand": ["Anand", "Khambhat", "Borsad"],
      "Aravalli": ["Modasa", "Bhiloda"],
      "Banaskantha": ["Palanpur", "Deesa", "Danta"],
      "Bharuch": ["Bharuch", "Ankleshwar", "Jhagadia"],
      "Bhavnagar": ["Bhavnagar", "Palitana", "Talaja", "Mahuva"],
      "Botad": ["Botad", "Gadhada"],
      "Dahod": ["Dahod", "Devgadbaria"],
      "Dang": ["Ahwa"],
      "Devbhumi Dwarka": ["Khambhalia", "Dwarka"],
      "Gandhinagar": ["Gandhinagar", "Kalol", "Mansa"],
      "Gir Somnath": ["Veraval", "Somnath", "Una"],
      "Jamnagar": ["Jamnagar", "Kalavad"],
      "Junagadh": ["Junagadh", "Mangrol"],
      "Kheda": ["Nadiad", "Kapadvanj"],
      "Kutch": ["Bhuj", "Gandhidham", "Mundra", "Anjar", "Mandvi"],
      "Mahisagar": ["Lunawada", "Santrampur"],
      "Mehsana": ["Mehsana", "Unjha", "Visnagar", "Kadi"],
      "Morbi": ["Morbi", "Halvad"],
      "Narmada": ["Rajpipla"],
      "Navsari": ["Navsari", "Gandevi", "Vansda"],
      "Panchmahal": ["Godhra", "Kalol"],
      "Patan": ["Patan", "Sidhpur"],
      "Porbandar": ["Porbandar"],
      "Rajkot": ["Rajkot", "Jetpur", "Gondal", "Wankaner"],
      "Sabarkantha": ["Himmatnagar", "Idar"],
      "Surat": ["Surat", "Bardoli", "Olpad"],
      "Surendranagar": ["Surendranagar", "Wadhwan", "Limbdi"],
      "Tapi": ["Vyara"],
      "Vadodara": ["Vadodara", "Padra", "Karjan"],
      "Valsad": ["Valsad", "Vapi", "Pardi"],
    },
  },
  "Haryana": {
    districts: {
      "Ambala": ["Ambala", "Ambala Cantt", "Naraingarh"],
      "Bhiwani": ["Bhiwani", "Loharu", "Tosham"],
      "Charkhi Dadri": ["Charkhi Dadri"],
      "Faridabad": ["Faridabad", "Ballabhgarh"],
      "Fatehabad": ["Fatehabad", "Ratia"],
      "Gurugram": ["Gurugram", "Manesar", "Sohna"],
      "Hisar": ["Hisar"],
      "Jhajjar": ["Jhajjar", "Bahadurgarh"],
      "Jind": ["Jind", "Safidon"],
      "Kaithal": ["Kaithal"],
      "Karnal": ["Karnal"],
      "Kurukshetra": ["Kurukshetra", "Thanesar"],
      "Mahendragarh": ["Narnaul"],
      "Nuh": ["Nuh"],
      "Palwal": ["Palwal", "Hodal"],
      "Panchkula": ["Panchkula", "Kalka"],
      "Panipat": ["Panipat"],
      "Rewari": ["Rewari"],
      "Rohtak": ["Rohtak"],
      "Sirsa": ["Sirsa", "Dabwali"],
      "Sonipat": ["Sonipat", "Gohana"],
      "Yamunanagar": ["Yamunanagar", "Jagadhri"],
    },
  },
  "Himachal Pradesh": {
    districts: {
      "Bilaspur": ["Bilaspur", "Ghumarwin"],
      "Chamba": ["Chamba", "Dalhousie", "Bharmour"],
      "Hamirpur": ["Hamirpur", "Barsar", "Nadaun"],
      "Kangra": ["Dharamshala", "Palampur", "Kangra", "Nurpur", "McLeod Ganj"],
      "Kinnaur": ["Reckong Peo", "Kalpa", "Sangla"],
      "Kullu": ["Kullu", "Manali", "Banjar", "Bhuntar"],
      "Lahaul and Spiti": ["Keylong", "Kaza", "Udaipur"],
      "Mandi": ["Mandi", "Sundarnagar", "Jogindernagar"],
      "Shimla": ["Shimla", "Rampur", "Rohru", "Theog", "Narkanda"],
      "Sirmaur": ["Nahan", "Paonta Sahib", "Rajgarh"],
      "Solan": ["Solan", "Parwanoo", "Baddi", "Nalagarh"],
      "Una": ["Una", "Amb", "Daulatpur"],
    },
  },
  "Jharkhand": {
    districts: {
      "Bokaro": ["Bokaro Steel City", "Chas", "Phusro"],
      "Chatra": ["Chatra"],
      "Deoghar": ["Deoghar", "Jasidih"],
      "Dhanbad": ["Dhanbad", "Jharia", "Sindri"],
      "Dumka": ["Dumka"],
      "East Singhbhum": ["Jamshedpur", "Adityapur", "Gamharia"],
      "Garhwa": ["Garhwa"],
      "Giridih": ["Giridih"],
      "Godda": ["Godda"],
      "Gumla": ["Gumla"],
      "Hazaribagh": ["Hazaribagh"],
      "Jamtara": ["Jamtara"],
      "Khunti": ["Khunti"],
      "Koderma": ["Koderma", "Jhumri Telaiya"],
      "Latehar": ["Latehar"],
      "Lohardaga": ["Lohardaga"],
      "Pakur": ["Pakur"],
      "Palamu": ["Medininagar"],
      "Ramgarh": ["Ramgarh"],
      "Ranchi": ["Ranchi", "Hatia", "Namkum", "Kanke"],
      "Sahibganj": ["Sahibganj"],
      "Saraikela Kharsawan": ["Saraikela", "Kharsawan"],
      "Simdega": ["Simdega"],
      "West Singhbhum": ["Chaibasa", "Chakradharpur"],
    },
  },
  "Karnataka": {
    districts: {
      "Bagalkot": ["Bagalkot", "Jamkhandi", "Mudhol"],
      "Ballari": ["Ballari", "Hospet", "Sandur"],
      "Belagavi": ["Belagavi", "Gokak", "Chikodi", "Khanapur"],
      "Bengaluru Urban": ["Bengaluru", "Yelahanka", "Whitefield", "Electronic City", "Indiranagar", "Marathahalli"],
      "Bengaluru Rural": ["Doddaballapur", "Devanahalli", "Nelamangala", "Hosakote"],
      "Bidar": ["Bidar"],
      "Chamarajanagar": ["Chamarajanagar", "Kollegal"],
      "Chikkaballapur": ["Chikkaballapur", "Chintamani"],
      "Chikkamagaluru": ["Chikkamagaluru", "Mudigere"],
      "Chitradurga": ["Chitradurga", "Challakere"],
      "Dakshina Kannada": ["Mangaluru", "Ullal", "Bantwal", "Puttur"],
      "Davanagere": ["Davanagere", "Harihar"],
      "Dharwad": ["Dharwad", "Hubballi"],
      "Gadag": ["Gadag-Betageri", "Ron"],
      "Hassan": ["Hassan", "Sakleshpur", "Arsikere", "Belur"],
      "Haveri": ["Haveri", "Ranebennur"],
      "Kalaburagi": ["Kalaburagi", "Sedam"],
      "Kodagu": ["Madikeri", "Virajpet", "Somwarpet"],
      "Kolar": ["Kolar", "Malur", "Bangarapet"],
      "Koppal": ["Koppal", "Gangawati"],
      "Mandya": ["Mandya", "Malavalli"],
      "Mysuru": ["Mysuru", "Nanjangud", "Hunsur"],
      "Raichur": ["Raichur", "Sindhanur"],
      "Ramanagara": ["Ramanagara", "Channapatna"],
      "Shivamogga": ["Shivamogga", "Bhadravati", "Sagar"],
      "Tumakuru": ["Tumakuru", "Tiptur"],
      "Udupi": ["Udupi", "Kundapura", "Karkala", "Manipal"],
      "Uttara Kannada": ["Karwar", "Sirsi", "Dandeli", "Bhatkal"],
      "Vijayapura": ["Vijayapura", "Indi", "Sindagi"],
      "Yadgir": ["Yadgir", "Shahapur"],
    },
  },
  "Kerala": {
    districts: {
      "Thiruvananthapuram": ["Thiruvananthapuram", "Attingal", "Nedumangad", "Varkala", "Neyyattinkara"],
      "Kollam": ["Kollam", "Kottarakkara", "Punalur", "Karunagappally"],
      "Pathanamthitta": ["Pathanamthitta", "Adoor", "Thiruvalla", "Pandalam"],
      "Alappuzha": ["Alappuzha", "Cherthala", "Kayamkulam", "Haripad"],
      "Kottayam": ["Kottayam", "Changanassery", "Erattupetta", "Pala", "Vaikom"],
      "Idukki": ["Painavu", "Thodupuzha", "Munnar", "Kattappana"],
      "Ernakulam": ["Kochi", "Angamaly", "Perumbavoor", "Aluva", "Muvattupuzha"],
      "Thrissur": ["Thrissur", "Chalakudy", "Irinjalakuda", "Guruvayur"],
      "Palakkad": ["Palakkad", "Ottapalam", "Shoranur", "Mannarkkad"],
      "Malappuram": ["Malappuram", "Manjeri", "Tirur", "Ponnani"],
      "Kozhikode": ["Kozhikode", "Vatakara", "Koyilandy", "Beypore"],
      "Wayanad": ["Kalpetta", "Mananthavady", "Sulthan Bathery"],
      "Kannur": ["Kannur", "Thalassery", "Mattannur", "Payyanur"],
      "Kasaragod": ["Kasaragod", "Kanhangad", "Manjeshwar"],
    },
  },
  "Madhya Pradesh": {
    districts: {
      "Bhopal": ["Bhopal", "Mandideep", "Berasia"],
      "Indore": ["Indore", "Pithampur", "Mhow", "Depalpur"],
      "Jabalpur": ["Jabalpur", "Sihora", "Panagar"],
      "Gwalior": ["Gwalior", "Morar", "Lashkar"],
      "Ujjain": ["Ujjain", "Nagda", "Badnagar"],
      "Sagar": ["Sagar", "Khurai"],
      "Rewa": ["Rewa", "Sirmour"],
      "Satna": ["Satna", "Nagod"],
      "Morena": ["Morena", "Ambah"],
      "Shivpuri": ["Shivpuri"],
      "Bhind": ["Bhind", "Mehgaon"],
      "Chhindwara": ["Chhindwara", "Parasia"],
      "Vidisha": ["Vidisha", "Sironj"],
      "Damoh": ["Damoh", "Hatta"],
      "Dewas": ["Dewas"],
      "Dhar": ["Dhar", "Kukshi"],
      "Khandwa": ["Khandwa"],
      "Khargone": ["Khargone", "Sanawad"],
      "Mandla": ["Mandla"],
      "Mandsaur": ["Mandsaur"],
      "Narsinghpur": ["Narsinghpur"],
      "Neemuch": ["Neemuch"],
      "Panna": ["Panna"],
      "Raisen": ["Raisen", "Begamganj"],
      "Rajgarh": ["Rajgarh", "Biaora"],
      "Ratlam": ["Ratlam", "Jaora"],
      "Seoni": ["Seoni"],
      "Shahdol": ["Shahdol"],
      "Shajapur": ["Shajapur"],
      "Sidhi": ["Sidhi"],
      "Singrauli": ["Singrauli", "Waidhan"],
      "Tikamgarh": ["Tikamgarh"],
      "Umaria": ["Umaria"],
    },
  },
  "Maharashtra": {
    districts: {
      "Ahmednagar": ["Ahmednagar", "Shrirampur", "Sangamner", "Kopargaon"],
      "Akola": ["Akola", "Balapur"],
      "Amravati": ["Amravati", "Achalpur"],
      "Aurangabad": ["Aurangabad", "Vaijapur", "Paithan"],
      "Beed": ["Beed", "Ambajogai"],
      "Bhandara": ["Bhandara", "Tumsar"],
      "Buldhana": ["Buldhana", "Malkapur"],
      "Chandrapur": ["Chandrapur", "Ballarpur", "Warora"],
      "Dhule": ["Dhule", "Shirpur"],
      "Gadchiroli": ["Gadchiroli"],
      "Gondia": ["Gondia"],
      "Hingoli": ["Hingoli"],
      "Jalgaon": ["Jalgaon", "Bhusawal", "Raver"],
      "Jalna": ["Jalna", "Partur"],
      "Kolhapur": ["Kolhapur", "Ichalkaranji", "Gadhinglaj"],
      "Latur": ["Latur", "Udgir"],
      "Mumbai City": ["Mumbai", "Colaba", "Fort", "Churchgate", "Dadar"],
      "Mumbai Suburban": ["Andheri", "Borivali", "Bandra", "Juhu", "Goregaon"],
      "Nagpur": ["Nagpur", "Kamptee", "Umred"],
      "Nanded": ["Nanded", "Kandhar"],
      "Nandurbar": ["Nandurbar", "Shahade"],
      "Nashik": ["Nashik", "Malegaon", "Sinnar", "Igatpuri"],
      "Osmanabad": ["Osmanabad", "Tuljapur"],
      "Palghar": ["Palghar", "Boisar", "Dahanu"],
      "Parbhani": ["Parbhani", "Jintur"],
      "Pune": ["Pune", "Pimpri-Chinchwad", "Lonavala", "Baramati"],
      "Raigad": ["Alibag", "Panvel", "Pen", "Mahad"],
      "Ratnagiri": ["Ratnagiri", "Chiplun", "Khed"],
      "Sangli": ["Sangli", "Miraj", "Tasgaon"],
      "Satara": ["Satara", "Karad", "Wai"],
      "Sindhudurg": ["Kudal", "Sawantwadi", "Vengurla", "Malvan"],
      "Solapur": ["Solapur", "Pandharpur", "Barshi"],
      "Thane": ["Thane", "Kalyan", "Dombivli", "Ulhasnagar", "Bhiwandi"],
      "Wardha": ["Wardha", "Hinganghat"],
      "Washim": ["Washim", "Karanja"],
      "Yavatmal": ["Yavatmal", "Pusad"],
    },
  },
  "Manipur": {
    districts: {
      "Bishnupur": ["Bishnupur", "Moirang"],
      "Churachandpur": ["Churachandpur"],
      "Imphal East": ["Porompat", "Heingang"],
      "Imphal West": ["Imphal", "Mayang Imphal"],
      "Jiribam": ["Jiribam"],
      "Kakching": ["Kakching"],
      "Kangpokpi": ["Kangpokpi"],
      "Senapati": ["Senapati", "Mao"],
      "Tamenglong": ["Tamenglong"],
      "Thoubal": ["Thoubal"],
      "Ukhrul": ["Ukhrul"],
    },
  },
  "Meghalaya": {
    districts: {
      "East Garo Hills": ["Williamnagar"],
      "North Garo Hills": ["Resubelpara"],
      "South Garo Hills": ["Baghmara"],
      "West Garo Hills": ["Tura"],
      "East Khasi Hills": ["Shillong", "Cherrapunji", "Mawsynram"],
      "West Khasi Hills": ["Nongstoin"],
      "Ri Bhoi": ["Nongpoh"],
      "East Jaintia Hills": ["Khliehriat"],
      "West Jaintia Hills": ["Jowai"],
    },
  },
  "Mizoram": {
    districts: {
      "Aizawl": ["Aizawl"],
      "Champhai": ["Champhai"],
      "Kolasib": ["Kolasib"],
      "Lawngtlai": ["Lawngtlai"],
      "Lunglei": ["Lunglei"],
      "Mamit": ["Mamit"],
      "Saiha": ["Saiha"],
      "Serchhip": ["Serchhip"],
    },
  },
  "Nagaland": {
    districts: {
      "Dimapur": ["Dimapur"],
      "Kiphire": ["Kiphire"],
      "Kohima": ["Kohima"],
      "Longleng": ["Longleng"],
      "Mokokchung": ["Mokokchung"],
      "Mon": ["Mon"],
      "Peren": ["Peren"],
      "Phek": ["Phek"],
      "Tuensang": ["Tuensang"],
      "Wokha": ["Wokha"],
      "Zunheboto": ["Zunheboto"],
    },
  },
  "Odisha": {
    districts: {
      "Angul": ["Angul", "Talcher"],
      "Balangir": ["Balangir", "Titlagarh"],
      "Balasore": ["Balasore"],
      "Bargarh": ["Bargarh"],
      "Bhadrak": ["Bhadrak"],
      "Cuttack": ["Cuttack", "Choudwar"],
      "Dhenkanal": ["Dhenkanal"],
      "Ganjam": ["Berhampur", "Aska", "Bhanjanagar"],
      "Jagatsinghpur": ["Jagatsinghpur"],
      "Jajpur": ["Jajpur"],
      "Jharsuguda": ["Jharsuguda"],
      "Kalahandi": ["Bhawanipatna"],
      "Kandhamal": ["Phulbani"],
      "Kendrapara": ["Kendrapara"],
      "Keonjhar": ["Keonjhar"],
      "Khordha": ["Bhubaneswar", "Khordha", "Jatni"],
      "Koraput": ["Koraput", "Jeypore"],
      "Malkangiri": ["Malkangiri"],
      "Mayurbhanj": ["Baripada", "Rairangpur"],
      "Nabarangpur": ["Nabarangpur"],
      "Nayagarh": ["Nayagarh"],
      "Puri": ["Puri"],
      "Rayagada": ["Rayagada"],
      "Sambalpur": ["Sambalpur"],
      "Sundargarh": ["Sundargarh", "Rourkela"],
    },
  },
  "Punjab": {
    districts: {
      "Amritsar": ["Amritsar", "Batala"],
      "Barnala": ["Barnala"],
      "Bathinda": ["Bathinda"],
      "Faridkot": ["Faridkot"],
      "Fatehgarh Sahib": ["Fatehgarh Sahib", "Sirhind"],
      "Fazilka": ["Fazilka"],
      "Ferozepur": ["Ferozepur"],
      "Gurdaspur": ["Gurdaspur"],
      "Hoshiarpur": ["Hoshiarpur", "Dasuya"],
      "Jalandhar": ["Jalandhar", "Phagwara", "Nakodar"],
      "Kapurthala": ["Kapurthala"],
      "Ludhiana": ["Ludhiana", "Khanna", "Jagraon"],
      "Malerkotla": ["Malerkotla"],
      "Mansa": ["Mansa"],
      "Moga": ["Moga"],
      "Pathankot": ["Pathankot"],
      "Patiala": ["Patiala", "Rajpura", "Nabha"],
      "Rupnagar": ["Rupnagar", "Anandpur Sahib"],
      "SAS Nagar (Mohali)": ["Mohali", "Kharar", "Dera Bassi", "Zirakpur"],
      "Sangrur": ["Sangrur", "Sunam"],
      "Nawanshahr": ["Nawanshahr"],
      "Sri Muktsar Sahib": ["Sri Muktsar Sahib"],
      "Tarn Taran": ["Tarn Taran"],
    },
  },
  "Rajasthan": {
    districts: {
      "Ajmer": ["Ajmer", "Beawar", "Kishangarh"],
      "Alwar": ["Alwar", "Behror", "Bhiwadi"],
      "Banswara": ["Banswara"],
      "Baran": ["Baran"],
      "Barmer": ["Barmer"],
      "Bharatpur": ["Bharatpur", "Deeg"],
      "Bhilwara": ["Bhilwara"],
      "Bikaner": ["Bikaner", "Nokha"],
      "Bundi": ["Bundi"],
      "Chittorgarh": ["Chittorgarh", "Nimbahera"],
      "Churu": ["Churu", "Sujangarh"],
      "Dausa": ["Dausa"],
      "Dholpur": ["Dholpur"],
      "Dungarpur": ["Dungarpur"],
      "Sri Ganganagar": ["Sri Ganganagar", "Suratgarh"],
      "Hanumangarh": ["Hanumangarh"],
      "Jaipur": ["Jaipur", "Sanganer", "Amber"],
      "Jaisalmer": ["Jaisalmer"],
      "Jalore": ["Jalore"],
      "Jhalawar": ["Jhalawar"],
      "Jhunjhunu": ["Jhunjhunu", "Pilani"],
      "Jodhpur": ["Jodhpur"],
      "Karauli": ["Karauli"],
      "Kota": ["Kota"],
      "Nagaur": ["Nagaur", "Merta"],
      "Pali": ["Pali"],
      "Pratapgarh": ["Pratapgarh"],
      "Rajsamand": ["Rajsamand"],
      "Sawai Madhopur": ["Sawai Madhopur"],
      "Sikar": ["Sikar", "Fatehpur"],
      "Sirohi": ["Sirohi", "Mount Abu"],
      "Tonk": ["Tonk"],
      "Udaipur": ["Udaipur"],
    },
  },
  "Sikkim": {
    districts: {
      "East Sikkim": ["Gangtok", "Singtam", "Rangpo"],
      "West Sikkim": ["Gyalshing", "Pelling"],
      "North Sikkim": ["Mangan", "Lachung"],
      "South Sikkim": ["Namchi", "Jorethang", "Ravangla"],
    },
  },
  "Tamil Nadu": {
    districts: {
      "Ariyalur": ["Ariyalur"],
      "Chengalpattu": ["Chengalpattu"],
      "Chennai": ["Chennai", "Ambattur", "Avadi", "Tambaram", "Porur"],
      "Coimbatore": ["Coimbatore", "Pollachi"],
      "Cuddalore": ["Cuddalore", "Chidambaram"],
      "Dharmapuri": ["Dharmapuri"],
      "Dindigul": ["Dindigul", "Palani"],
      "Erode": ["Erode", "Gobichettipalayam"],
      "Kallakurichi": ["Kallakurichi"],
      "Kancheepuram": ["Kancheepuram"],
      "Kanyakumari": ["Nagercoil"],
      "Karur": ["Karur"],
      "Krishnagiri": ["Krishnagiri", "Hosur"],
      "Madurai": ["Madurai"],
      "Mayiladuthurai": ["Mayiladuthurai"],
      "Nagapattinam": ["Nagapattinam"],
      "Namakkal": ["Namakkal"],
      "Nilgiris": ["Ooty"],
      "Perambalur": ["Perambalur"],
      "Pudukkottai": ["Pudukkottai"],
      "Ramanathapuram": ["Ramanathapuram"],
      "Ranipet": ["Ranipet"],
      "Salem": ["Salem"],
      "Sivaganga": ["Sivaganga", "Karaikudi"],
      "Tenkasi": ["Tenkasi"],
      "Thanjavur": ["Thanjavur", "Kumbakonam"],
      "Theni": ["Theni", "Periyakulam"],
      "Thoothukudi": ["Thoothukudi", "Kovilpatti"],
      "Tiruchirappalli": ["Tiruchirappalli"],
      "Tirunelveli": ["Tirunelveli"],
      "Tirupathur": ["Tirupathur"],
      "Tiruppur": ["Tiruppur"],
      "Tiruvallur": ["Tiruvallur"],
      "Tiruvannamalai": ["Tiruvannamalai"],
      "Tiruvarur": ["Tiruvarur"],
      "Vellore": ["Vellore"],
      "Viluppuram": ["Viluppuram"],
      "Virudhunagar": ["Virudhunagar", "Sivakasi"],
    },
  },
  "Telangana": {
    districts: {
      "Adilabad": ["Adilabad"],
      "Bhadradri Kothagudem": ["Kothagudem", "Palvancha"],
      "Hanumakonda": ["Hanumakonda"],
      "Hyderabad": ["Hyderabad", "Secunderabad", "Kukatpally", "Banjara Hills"],
      "Jagtial": ["Jagtial"],
      "Jangaon": ["Jangaon"],
      "Karimnagar": ["Karimnagar", "Ramagundam"],
      "Khammam": ["Khammam"],
      "Mahabubabad": ["Mahabubabad"],
      "Mahabubnagar": ["Mahabubnagar"],
      "Mancherial": ["Mancherial"],
      "Medak": ["Medak"],
      "Medchal-Malkajgiri": ["Malkajgiri", "Kompally", "Medchal"],
      "Nagarkurnool": ["Nagarkurnool"],
      "Nalgonda": ["Nalgonda", "Miryalaguda"],
      "Narayanpet": ["Narayanpet"],
      "Nirmal": ["Nirmal"],
      "Nizamabad": ["Nizamabad", "Armoor", "Bodhan"],
      "Peddapalli": ["Peddapalli"],
      "Rajanna Sircilla": ["Sircilla"],
      "Rangareddy": ["Shamshabad", "LB Nagar", "Maheshwaram"],
      "Sangareddy": ["Sangareddy", "Zaheerabad"],
      "Siddipet": ["Siddipet"],
      "Suryapet": ["Suryapet"],
      "Vikarabad": ["Vikarabad"],
      "Wanaparthy": ["Wanaparthy"],
      "Warangal": ["Warangal", "Kazipet"],
      "Yadadri Bhuvanagiri": ["Yadadri", "Bhuvanagiri"],
    },
  },
  "Tripura": {
    districts: {
      "Dhalai": ["Ambassa"],
      "Gomati": ["Udaipur"],
      "Khowai": ["Khowai"],
      "North Tripura": ["Dharmanagar", "Kailashahar"],
      "Sepahijala": ["Bishramganj"],
      "South Tripura": ["Belonia", "Sabroom"],
      "West Tripura": ["Agartala", "Jirania", "Mohanpur"],
    },
  },
  "Uttar Pradesh": {
    districts: {
      "Agra": ["Agra"],
      "Aligarh": ["Aligarh"],
      "Ambedkar Nagar": ["Akbarpur"],
      "Ayodhya": ["Ayodhya", "Faizabad"],
      "Azamgarh": ["Azamgarh"],
      "Baghpat": ["Baghpat"],
      "Bahraich": ["Bahraich"],
      "Ballia": ["Ballia"],
      "Balrampur": ["Balrampur"],
      "Banda": ["Banda"],
      "Barabanki": ["Barabanki"],
      "Bareilly": ["Bareilly"],
      "Basti": ["Basti"],
      "Bijnor": ["Bijnor"],
      "Bulandshahr": ["Bulandshahr"],
      "Chandauli": ["Chandauli"],
      "Chitrakoot": ["Chitrakoot"],
      "Deoria": ["Deoria"],
      "Etah": ["Etah"],
      "Etawah": ["Etawah"],
      "Farrukhabad": ["Farrukhabad"],
      "Fatehpur": ["Fatehpur"],
      "Firozabad": ["Firozabad"],
      "Gautam Buddha Nagar": ["Noida", "Greater Noida", "Dadri"],
      "Ghaziabad": ["Ghaziabad", "Loni", "Modinagar"],
      "Gonda": ["Gonda"],
      "Gorakhpur": ["Gorakhpur"],
      "Hardoi": ["Hardoi"],
      "Hathras": ["Hathras"],
      "Jaunpur": ["Jaunpur"],
      "Jhansi": ["Jhansi"],
      "Kanpur Nagar": ["Kanpur", "Kalyanpur"],
      "Kushinagar": ["Padrauna"],
      "Lucknow": ["Lucknow", "Bakshi Ka Talab", "Malihabad"],
      "Mathura": ["Mathura", "Vrindavan"],
      "Mau": ["Mau"],
      "Meerut": ["Meerut"],
      "Mirzapur": ["Mirzapur"],
      "Moradabad": ["Moradabad"],
      "Muzaffarnagar": ["Muzaffarnagar"],
      "Pilibhit": ["Pilibhit"],
      "Prayagraj": ["Prayagraj", "Phulpur"],
      "Raebareli": ["Raebareli"],
      "Rampur": ["Rampur"],
      "Saharanpur": ["Saharanpur"],
      "Sant Kabir Nagar": ["Khalilabad"],
      "Shahjahanpur": ["Shahjahanpur"],
      "Sitapur": ["Sitapur"],
      "Sultanpur": ["Sultanpur"],
      "Unnao": ["Unnao"],
      "Varanasi": ["Varanasi"],
    },
  },
  "Uttarakhand": {
    districts: {
      "Almora": ["Almora", "Ranikhet"],
      "Bageshwar": ["Bageshwar"],
      "Chamoli": ["Gopeshwar", "Joshimath"],
      "Champawat": ["Champawat"],
      "Dehradun": ["Dehradun", "Rishikesh"],
      "Haridwar": ["Haridwar", "Roorkee", "Laksar"],
      "Nainital": ["Nainital", "Haldwani"],
      "Pauri Garhwal": ["Pauri", "Kotdwar"],
      "Pithoragarh": ["Pithoragarh"],
      "Rudraprayag": ["Rudraprayag"],
      "Tehri Garhwal": ["Tehri", "Chamba"],
      "Udham Singh Nagar": ["Rudrapur", "Kashipur"],
      "Uttarkashi": ["Uttarkashi"],
    },
  },
  "West Bengal": {
    districts: {
      "Alipurduar": ["Alipurduar"],
      "Bankura": ["Bankura", "Bishnupur"],
      "Birbhum": ["Suri", "Bolpur"],
      "Cooch Behar": ["Cooch Behar"],
      "Dakshin Dinajpur": ["Balurghat"],
      "Darjeeling": ["Darjeeling", "Siliguri", "Kurseong"],
      "Hooghly": ["Chinsurah", "Chandannagar", "Serampore"],
      "Howrah": ["Howrah", "Uluberia"],
      "Jalpaiguri": ["Jalpaiguri"],
      "Jhargram": ["Jhargram"],
      "Kalimpong": ["Kalimpong"],
      "Kolkata": ["Kolkata", "Salt Lake"],
      "Malda": ["Malda", "English Bazar"],
      "Murshidabad": ["Berhampore", "Jangipur"],
      "Nadia": ["Krishnanagar", "Kalyani", "Ranaghat"],
      "North 24 Parganas": ["Barasat", "Barrackpore", "Dum Dum"],
      "Paschim Bardhaman": ["Asansol", "Durgapur", "Raniganj"],
      "Paschim Medinipur": ["Midnapore"],
      "Purba Bardhaman": ["Bardhaman"],
      "Purba Medinipur": ["Tamluk"],
      "Purulia": ["Purulia"],
      "South 24 Parganas": ["Diamond Harbour", "Baruipur"],
      "Uttar Dinajpur": ["Raiganj"],
    },
  },
  "Delhi": {
    districts: {
      "Central Delhi": ["Connaught Place", "Paharganj", "Karol Bagh"],
      "East Delhi": ["Preet Vihar", "Laxmi Nagar", "Mayur Vihar"],
      "New Delhi": ["New Delhi", "Chanakyapuri"],
      "North Delhi": ["Civil Lines", "Model Town", "Burari"],
      "North East Delhi": ["Seelampur", "Yamuna Vihar"],
      "North West Delhi": ["Rohini", "Pitampura", "Shalimar Bagh"],
      "South Delhi": ["Hauz Khas", "Saket", "Greater Kailash", "Okhla"],
      "South West Delhi": ["Dwarka", "Uttam Nagar", "Palam"],
      "West Delhi": ["Rajouri Garden", "Tilak Nagar", "Vikaspuri"],
    },
  },
  "Jammu and Kashmir": {
    districts: {
      "Anantnag": ["Anantnag"],
      "Baramulla": ["Baramulla", "Handwara"],
      "Budgam": ["Budgam"],
      "Doda": ["Doda"],
      "Jammu": ["Jammu", "Udhampur"],
      "Kathua": ["Kathua"],
      "Kishtwar": ["Kishtwar"],
      "Kulgam": ["Kulgam"],
      "Kupwara": ["Kupwara"],
      "Poonch": ["Poonch"],
      "Pulwama": ["Pulwama"],
      "Rajouri": ["Rajouri"],
      "Ramban": ["Ramban"],
      "Reasi": ["Reasi"],
      "Samba": ["Samba"],
      "Srinagar": ["Srinagar"],
      "Udhampur": ["Udhampur"],
    },
  },
  "Ladakh": {
    districts: {
      "Leh": ["Leh", "Nubra"],
      "Kargil": ["Kargil", "Zanskar"],
    },
  },
  "Puducherry": {
    districts: {
      "Puducherry": ["Puducherry", "Ozhukarai"],
      "Karaikal": ["Karaikal"],
      "Mahe": ["Mahe"],
      "Yanam": ["Yanam"],
    },
  },
  "Chandigarh": {
    districts: {
      "Chandigarh": ["Chandigarh", "Manimajra"],
    },
  },
  "Andaman and Nicobar Islands": {
    districts: {
      "South Andaman": ["Port Blair", "Aberdeen Bazaar"],
      "North and Middle Andaman": ["Mayabunder", "Diglipur"],
      "Nicobar": ["Car Nicobar"],
    },
  },
  "Dadra and Nagar Haveli and Daman and Diu": {
    districts: {
      "Dadra and Nagar Haveli": ["Silvassa"],
      "Daman": ["Daman"],
      "Diu": ["Diu"],
    },
  },
  "Lakshadweep": {
    districts: {
      "Lakshadweep": ["Kavaratti", "Agatti", "Minicoy"],
    },
  },
};

const STATES = Object.keys(INDIA_LOCATION_DATA).sort();

// ─── Pincode API ──────────────────────────────────────────────────────────────
const fetchLocationByPincode = async (pincode, signal) => {
  if (!/^\d{6}$/.test(pincode)) return null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, { signal });
    const data = await res.json();
    if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      return {
        state:       po.State,
        district:    po.District,
        city:        po.Division || po.Block || po.Name,
        postOffices: data[0].PostOffice.map((p) => p.Name),
      };
    }
  } catch (err) {
    if (err.name !== "AbortError") console.error("Pincode fetch error:", err);
  }
  return null;
};

const inputBase =
  "w-full bg-slate-800/60 border rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 transition-all";

function ic(hasError, isOk) {
  if (hasError) return `${inputBase} border-red-500/60 focus:ring-red-500/30`;
  if (isOk)     return `${inputBase} border-emerald-500/40 focus:ring-emerald-500/20 focus:border-emerald-500/40`;
  return `${inputBase} border-slate-700/50 focus:ring-indigo-500/30 focus:border-indigo-500/50`;
}

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function FieldLabel({ label, required }) {
  return (
    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      {msg}
    </p>
  );
}

function AutofillBadge() {
  return (
    <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
      <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Auto-filled from pincode
    </span>
  );
}

export default function LocationSelector(props) {
  const {
    mode         = "manual",
    showPincode  = true,
    // RHF
    register,
    errors:    rhfErrors,
    setValue,
    trigger,
    // Manual
    values:    manualValues,
    onChange:  manualOnChange,
    onBlur:    manualOnBlur,
    errors:    manualErrors,
    touched:   manualTouched,
    fieldNames = {},
  } = props;

  const fn = {
    state:    fieldNames.state    || "state",
    district: fieldNames.district || "district",
    city:     fieldNames.city     || "city",
    pincode:  fieldNames.pincode  || "pincode",
  };

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [selectedState,    setSelectedState]    = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity,     setSelectedCity]     = useState("");
  const [pincodeInput,     setPincodeInput]     = useState("");

  const [districts, setDistricts] = useState([]);
  const [cities,    setCities]    = useState([]);

  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeStatus,  setPincodeStatus]  = useState(null); // "ok" | "error" | null
  const [autofilled,     setAutofilled]     = useState(false);

  const debounceRef  = useRef(null);
  const abortRef     = useRef(null);

  // ── Sync RHF setValue safely ───────────────────────────────────────────────
  const setField = useCallback(
    (name, value, validate = true) => {
      if (mode === "rhf") {
        setValue(name, value, { shouldValidate: validate, shouldDirty: true });
      } else {
        manualOnChange?.(name, value);
      }
    },
    [mode, setValue, manualOnChange]
  );

  // ── State change handler ───────────────────────────────────────────────────
  const applyState = useCallback(
    (state, propagate = true) => {
      const districtMap = INDIA_LOCATION_DATA[state]?.districts || {};
      const dList       = Object.keys(districtMap).sort();

      setSelectedState(state);
      setDistricts(dList);
      setSelectedDistrict("");
      setCities([]);
      setSelectedCity("");
      setAutofilled(false);

      if (propagate) {
        setField(fn.state,    state, true);
        setField(fn.district, "",    false);
        setField(fn.city,     "",    false);
      }
    },
    [fn, setField]
  );

  // ── District change handler ────────────────────────────────────────────────
  const applyDistrict = useCallback(
    (district, stateKey, propagate = true) => {
      const districtMap = INDIA_LOCATION_DATA[stateKey]?.districts || {};
      const cList       = (districtMap[district] || []).sort();

      setSelectedDistrict(district);
      setCities(cList);
      setSelectedCity("");
      setAutofilled(false);

      if (propagate) {
        setField(fn.district, district, true);
        setField(fn.city,     "",       false);
      }
    },
    [fn, setField]
  );

  // ── City change handler ────────────────────────────────────────────────────
  const applyCity = useCallback(
    (city) => {
      setSelectedCity(city);
      setAutofilled(false);
      setField(fn.city, city, true);
    },
    [fn, setField]
  );

  // ── Pincode autofill ───────────────────────────────────────────────────────
  const handlePincodeChange = useCallback(
    (raw) => {
      const val = raw.replace(/\D/g, "").slice(0, 6);
      setPincodeInput(val);
      setPincodeStatus(null);
      setAutofilled(false);
      setField(fn.pincode, val, false);

      // Cancel previous requests
      clearTimeout(debounceRef.current);
      abortRef.current?.abort();

      if (val.length !== 6) return;

      debounceRef.current = setTimeout(async () => {
        const controller = new AbortController();
        abortRef.current = controller;

        setPincodeLoading(true);
        const result = await fetchLocationByPincode(val, controller.signal);
        setPincodeLoading(false);

        if (!result) {
          setPincodeStatus("error");
          return;
        }

        // Match state (case-insensitive)
        const matchedState = STATES.find(
          (s) => s.toLowerCase() === result.state?.toLowerCase()
        );

        if (!matchedState) {
          setPincodeStatus("error");
          return;
        }

        // Build districts for matched state
        const districtMap     = INDIA_LOCATION_DATA[matchedState]?.districts || {};
        const matchedDistrict = Object.keys(districtMap).find(
          (d) => d.toLowerCase() === result.district?.toLowerCase()
        );

        // Apply state
        const dList = Object.keys(districtMap).sort();
        setSelectedState(matchedState);
        setDistricts(dList);
        setField(fn.state, matchedState, true);

        if (matchedDistrict) {
          const cList = (districtMap[matchedDistrict] || []).sort();
          setSelectedDistrict(matchedDistrict);
          setCities(cList);
          setField(fn.district, matchedDistrict, true);

          // Match city
          const normalizedResultCity = result.city?.toLowerCase() || "";
          const matchedCity =
            cList.find((c) => c.toLowerCase().includes(normalizedResultCity)) ||
            cList[0] ||
            result.city;

          if (matchedCity) {
            setSelectedCity(matchedCity);
            setField(fn.city, matchedCity, true);
          }
        } else {
          // District not in our data, let user type
          setSelectedDistrict(result.district || "");
          setField(fn.district, result.district || "", true);
        }

        setField(fn.pincode, val, true);
        setPincodeStatus("ok");
        setAutofilled(true);

        // Trigger validation for all location fields at once
        if (mode === "rhf") {
          trigger?.([fn.state, fn.district, fn.city, fn.pincode]);
        }
      }, 500);
    },
    [fn, mode, setField, trigger]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  // ── Sync manual values on mount ────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "manual" || !manualValues) return;
    const { state, district, city, pincode } = manualValues;
    if (state)    applyState(state, false);
    if (district) applyDistrict(district, state, false);
    if (city)     { setSelectedCity(city); }
    if (pincode)  setPincodeInput(pincode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Error readers ──────────────────────────────────────────────────────────
  const err = (key) => {
    if (mode === "rhf")     return rhfErrors?.[key]?.message;
    if (manualTouched?.[key]) return manualErrors?.[key];
    return undefined;
  };

  const blur = (key) => {
    if (mode === "manual") manualOnBlur?.(key);
    if (mode === "rhf")    trigger?.(key);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Location Details
        </span>
        {autofilled && <AutofillBadge />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── 1. PINCODE (first) ─────────────────────────────────────────────── */}
        {showPincode && (
          <div>
            <FieldLabel label="Pincode" required />
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit pincode"
                value={pincodeInput}
                onChange={(e) => handlePincodeChange(e.target.value)}
                onBlur={() => blur(fn.pincode)}
                className={
                  ic(
                    !!(err(fn.pincode) || pincodeStatus === "error"),
                    pincodeStatus === "ok"
                  ) + " pr-10"
                }
                aria-label="Pincode"
                aria-describedby="pincode-hint"
              />
              {/* RHF hidden field */}
              {mode === "rhf" && (
                <input type="hidden" {...register?.(fn.pincode)} value={pincodeInput} />
              )}
              {/* Status icon */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {pincodeLoading && (
                  <span className="text-indigo-400"><Spinner /></span>
                )}
                {!pincodeLoading && pincodeStatus === "ok" && (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {!pincodeLoading && pincodeStatus === "error" && (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>

            {/* Status messages */}
            {!pincodeLoading && pincodeStatus === "error" && (
              <p className="mt-1.5 text-xs text-orange-400 flex items-center gap-1" role="alert">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pincode not found — please fill location manually
              </p>
            )}
            {!pincodeLoading && pincodeStatus === "ok" && (
              <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1" role="status">
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Location auto-filled from pincode
              </p>
            )}
            {!pincodeStatus && (
              <p id="pincode-hint" className="mt-1 text-xs text-slate-600">
                Enter pincode to auto-fill location fields
              </p>
            )}
            <FieldError msg={err(fn.pincode)} />
          </div>
        )}

        {/* ── 2. CITY (second) ──────────────────────────────────────────────── */}
        <div>
          <FieldLabel label="City / Town" required />
          {cities.length > 0 ? (
            <select
              value={selectedCity}
              onChange={(e) => applyCity(e.target.value)}
              onBlur={() => blur(fn.city)}
              disabled={!selectedDistrict}
              className={`${ic(!!err(fn.city), !!(selectedCity && !err(fn.city)))} appearance-none`}
              aria-label="City"
            >
              <option value="">Select city…</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder={selectedDistrict ? "Enter city / town" : "Fill district first"}
              value={selectedCity}
              onChange={(e) => applyCity(e.target.value)}
              onBlur={() => blur(fn.city)}
              disabled={!selectedDistrict && !selectedState}
              className={ic(!!err(fn.city), !!(selectedCity && !err(fn.city)))}
              aria-label="City"
            />
          )}
          {mode === "rhf" && (
            <input type="hidden" {...register?.(fn.city)} value={selectedCity} />
          )}
          <FieldError msg={err(fn.city)} />
        </div>

        {/* ── 3. DISTRICT (third) ───────────────────────────────────────────── */}
        <div>
          <FieldLabel label="District" required />
          {districts.length > 0 ? (
            <select
              value={selectedDistrict}
              onChange={(e) => applyDistrict(e.target.value, selectedState)}
              onBlur={() => blur(fn.district)}
              disabled={!selectedState}
              className={`${ic(!!err(fn.district), !!(selectedDistrict && !err(fn.district)))} appearance-none`}
              aria-label="District"
            >
              <option value="">Select district…</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder={selectedState ? "Enter district" : "Select state first"}
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setField(fn.district, e.target.value, true);
              }}
              onBlur={() => blur(fn.district)}
              disabled={!selectedState}
              className={ic(!!err(fn.district), !!(selectedDistrict && !err(fn.district)))}
              aria-label="District"
            />
          )}
          {mode === "rhf" && (
            <input type="hidden" {...register?.(fn.district)} value={selectedDistrict} />
          )}
          <FieldError msg={err(fn.district)} />
        </div>

        {/* ── 4. STATE (fourth) ─────────────────────────────────────────────── */}
        <div>
          <FieldLabel label="State" required />
          <select
            value={selectedState}
            onChange={(e) => applyState(e.target.value)}
            onBlur={() => blur(fn.state)}
            className={`${ic(!!err(fn.state), !!(selectedState && !err(fn.state)))} appearance-none`}
            aria-label="State"
          >
            <option value="">Select state…</option>
            {STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {mode === "rhf" && (
            <input type="hidden" {...register?.(fn.state)} value={selectedState} />
          )}
          <FieldError msg={err(fn.state)} />
        </div>

      </div>
    </div>
  );
}

// ─── Named exports ────────────────────────────────────────────────────────────
export { STATES, INDIA_LOCATION_DATA, fetchLocationByPincode };