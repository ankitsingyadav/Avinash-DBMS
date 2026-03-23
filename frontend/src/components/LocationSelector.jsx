import React, { useState, useEffect, useRef, useCallback } from "react";
import { useController } from "react-hook-form";
// ─── India Location Data ──────────────────────────────────────────────────────
// Comprehensive state → districts mapping
const INDIA_LOCATION_DATA = {
"Andhra Pradesh" : {
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
    "YSR Kadapa": ["Kadapa", "Proddatur", "Pulivendula", "Jammalamadugu"]
  }
},
  "Arunachal Pradesh": {
  districts: {
    "Tawang": ["Tawang Town"],
    "West Kameng": ["Bomdila", "Dirang"],
    "Bichom": ["Napangphung"],
    "East Kameng": ["Seppa"],
    "Pakke-Kessang": ["Lemmi", "Seijosa"],
    "Kurung Kumey": ["Koloriang"],
    "Papum Pare": ["Yupia", "Doimukh", "Kimín"],
    "Kra Daadi": ["Jamin", "Palin"],
    "Lower Subansiri": ["Ziro"],
    "Kamle": ["Raga"],
    "Keyi Panyor": ["Yachuli"],
    "Upper Subansiri": ["Daporijo"],
    "Shi-Yomi": ["Tato", "Mechuka"],
    "West Siang": ["Aalo (Along)"],
    "Lepa-Rada": ["Basar"],
    "Lower Siang": ["Likabali"],
    "Siang": ["Boleng"],
    "Upper Siang": ["Yingkiong"],
    "East Siang": ["Pasighat", "Ruksin"],
    "Dibang Valley": ["Anini"],
    "Lower Dibang Valley": ["Roing"],
    "Lohit": ["Tezu"],
    "Anjaw": ["Hawai"],
    "Namsai": ["Namsai"],
    "Changlang": ["Changlang"],
    "Tirap": ["Khonsa"],
    "Longding": ["Longding"],
    "Itanagar Capital Complex": ["Itanagar", "Naharlagun"]  // Yeh special hai, full district nahi count hota lekin alag treat kiya jata hai
  }
},
  "Assam": {
  districts: {
    "Baksa": ["Mushalpur"],
    "Barpeta": ["Barpeta", "Pathsala"],
    "Bajali": ["Pathsala"],
    "Biswanath": ["Biswanath Chariali"],
    "Bongaigaon": ["Bongaigaon"],
    "Cachar": ["Silchar", "Sonai", "Lakhipur"],
    "Charaideo": ["Sonari"],
    "Chirang": ["Kajalgaon"],
    "Darrang": ["Mangaldoi", "Sipajhar"],
    "Dhemaji": ["Dhemaji"],
    "Dhubri": ["Dhubri", "Bilasipara", "Chapar"],
    "Dibrugarh": ["Dibrugarh", "Naharkatia", "Duliajan", "Naharkatia"],
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
    "South Salmara-Mankachar": ["Hatsingimari / Balrampur"],
    "Tinsukia": ["Tinsukia", "Digboi", "Doom Dooma", "Margherita"],
    "Udalguri": ["Udalguri"],
    "West Karbi Anglong": ["Hamren"]
  }
},
  "Bihar": {
  districts: {
    "Araria": ["Araria"],
    "Arwal": ["Arwal"],
    "Aurangabad": ["Aurangabad"],
    "Banka": ["Banka"],
    "Begusarai": ["Begusarai"],
    "Bhagalpur": ["Bhagalpur", "Kahalgaon"],
    "Bhojpur": ["Arrah", "Ara"],
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
    "Patna": ["Patna", "Danapur", "Phulwarisharif", "Maner", "Hajipur (nearby)"],
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
    "West Champaran": ["Bettiah"]
  }
},
 "Chhattisgarh": {
  districts: {
    "Balod": ["Balod"],
    "Baloda Bazar-Bhatapara": ["Baloda Bazar", "Bhatapara"],
    "Balrampur-Ramanujganj": ["Balrampur"],
    "Bastar": ["Jagdalpur"],
    "Bemetara": ["Bemetara"],
    "Bijapur": ["Bijapur"],
    "Bilaspur": ["Bilaspur"],
    "Dantewada (Dakshin Bastar Dantewada)": ["Dantewada"],
    "Dhamtari": ["Dhamtari"],
    "Durg": ["Durg", "Bhilai", "Bhilai Charoda"],
    "Gariaband": ["Gariaband"],
    "Gaurela-Pendra-Marwahi": ["Gaurela"],
    "Janjgir-Champa": ["Janjgir", "Champa"],
    "Jashpur": ["Jashpur Nagar"],
    "Kabirdham (Kawardha)": ["Kawardha"],
    "Kanker (Uttar Bastar Kanker)": ["Kanker"],
    "Khairagarh-Chhuikhadan-Gandai": ["Khairagarh"],
    "Kondagaon": ["Kondagaon"],
    "Korba": ["Korba"],
    "Korea": ["Baikunthpur"],
    "Mahasamund": ["Mahasamund"],
    "Manendragarh-Chirmiri-Bharatpur (MCB)": ["Manendragarh", "Chirmiri"],
    "Manpur-Mohla": ["Manpur"],
    "Mungeli": ["Mungeli"],
    "Narayanpur": ["Narayanpur"],
    "Raigarh": ["Raigarh"],
    "Raipur": ["Raipur", "Birgaon", "Mandir Hasoud", "Simga"],
    "Rajnandgaon": ["Rajnandgaon", "Khairagarh (nearby area)"],
    "Sakti": ["Sakti"],
    "Sarangarh-Bilaigarh": ["Sarangarh"],
    "Sukma": ["Sukma"],
    "Surajpur": ["Surajpur"],
    "Surguja (Ambikapur)": ["Ambikapur"]
  }
},
 "Goa": {
  districts: {
    "North Goa": ["Panaji (Panjim)", "Mapusa", "Ponda", "Bicholim", "Pernem", "Calangute", "Anjuna", "Arambol", "Valpoi"],
    "South Goa": ["Margao (Madgaon)", "Vasco da Gama (Mormugao)", "Quepem", "Sanguem", "Curchorem", "Canacona (Chaudi)", "Colva"],
    "Kushavati": ["(Headquarters - likely in Sanguem/Quepem area or proposed)", "Sanguem", "Quepem", "Canacona", "Dharbandora"]  // Newer district, covering inland/southern talukas
  }
},
  "Gujarat": {
  districts: {
    "Ahmedabad": ["Ahmedabad", "Sanand", "Viramgam", "Dholka", "Bavla"],
    "Amreli": ["Amreli", "Savarkundla", "Rajula", "Una"],
    "Anand": ["Anand", "Khambhat", "Borsad"],
    "Aravalli": ["Modasa", "Bhiloda"],
    "Banaskantha": ["Palanpur", "Deesa", "Danta", "Thara"],
    "Bharuch": ["Bharuch", "Ankleshwar", "Jhagadia"],
    "Bhavnagar": ["Bhavnagar", "Palitana", "Talaja", "Mahuva"],
    "Botad": ["Botad", "Gadhada"],
    "Chhota Udaipur": ["Chhota Udaipur", "Pavi Jetpur"],
    "Dahod": ["Dahod", "Devgadbaria", "Jhalod"],
    "Dang": ["Ahwa"],
    "Devbhumi Dwarka": ["Khambhalia", "Dwarka", "Kalyanpur"],
    "Gandhinagar": ["Gandhinagar", "Kalol", "Mansa", "Dahegam"],
    "Gir Somnath": ["Veraval", "Somnath", "Una", "Kodinar"],
    "Jamnagar": ["Jamnagar", "Dwarka (nearby area)", "Kalavad"],
    "Junagadh": ["Junagadh", "Mangrol", "Visavadar"],
    "Kheda": ["Nadiad", "Kapadvanj", "Matar"],
    "Kutch": ["Bhuj", "Gandhidham", "Mundra", "Anjar", "Mandvi"],
    "Mahisagar": ["Lunawada", "Santrampur"],
    "Mehsana": ["Mehsana", "Unjha", "Visnagar", "Kadi"],
    "Morbi": ["Morbi", "Halvad", "Maliya"],
    "Narmada": ["Rajpipla", "Dediyapada"],
    "Navsari": ["Navsari", "Gandevi", "Vansda"],
    "Panchmahal": ["Godhra", "Kalol", "Lunawada (nearby)"],
    "Patan": ["Patan", "Sidhpur", "Chanasma"],
    "Porbandar": ["Porbandar", "Ranavav"],
    "Rajkot": ["Rajkot", "Jetpur", "Gondal", "Wankaner"],
    "Sabarkantha": ["Himmatnagar", "Idar", "Khedbrahma"],
    "Surat": ["Surat", "Bardoli", "Olpad", "Kamrej"],
    "Surendranagar": ["Surendranagar", "Wadhwan", "Limbdi", "Chotila"],
    "Tapi": ["Vyara", "Songadh"],
    "Vadodara": ["Vadodara", "Padra", "Karjan", "Dabhoi"],
    "Valsad": ["Valsad", "Vapi", "Pardi", "Dharampur"],
    "Vav-Tharad": ["Tharad", "Vav"]
  }
},
 "Haryana": {
  districts: {
    "Ambala": ["Ambala", "Ambala Cantt", "Naraingarh"],
    "Bhiwani": ["Bhiwani", "Loharu", "Tosham"],
    "Charkhi Dadri": ["Charkhi Dadri"],
    "Faridabad": ["Faridabad", "Ballabhgarh"],
    "Fatehabad": ["Fatehabad", "Ratia"],
    "Gurugram": ["Gurugram", "Manesar", "Sohna"],
    "Hansi": ["Hansi", "Narnaund", "Bass"],
    "Hisar": ["Hisar"],
    "Jhajjar": ["Jhajjar", "Bahadurgarh"],
    "Jind": ["Jind", "Safidon"],
    "Kaithal": ["Kaithal"],
    "Karnal": ["Karnal"],
    "Kurukshetra": ["Kurukshetra", "Thanesar"],
    "Mahendragarh": ["Narnaul"],
    "Nuh": ["Nuh", "Tauru"],
    "Palwal": ["Palwal", "Hodal"],
    "Panchkula": ["Panchkula", "Kalka"],
    "Panipat": ["Panipat"],
    "Rewari": ["Rewari"],
    "Rohtak": ["Rohtak"],
    "Sirsa": ["Sirsa", "Dabwali"],
    "Sonipat": ["Sonipat", "Gohana", "Ganaur"],
    "Yamunanagar": ["Yamunanagar", "Jagadhri"]
  }
},
 "Himachal Pradesh": {
  districts: {
    "Bilaspur": ["Bilaspur", "Ghumarwin", "Berthin", "Swargghat"],
    "Chamba": ["Chamba", "Dalhousie", "Khajjiar", "Bharmour", "Salooni"],
    "Hamirpur": ["Hamirpur", "Barsar", "Nadaun", "Sujanpur Tira"],
    "Kangra": ["Dharamshala", "Palampur", "Kangra", "Nurpur", "Baijnath", "McLeod Ganj", "Jwalamukhi", "Nagrota Bagwan", "Dehra Gopipur"],
    "Kinnaur": ["Reckong Peo", "Kalpa", "Sangla", "Pooh", "Nichar"],
    "Kullu": ["Kullu", "Manali", "Banjar", "Bhuntar", "Naggar", "Anni"],
    "Lahaul and Spiti": ["Keylong", "Kaza", "Udaipur", "Sissu", "Jispa"],
    "Mandi": ["Mandi", "Sundarnagar", "Jogindernagar", "Karsog", "Rewalsar", "Aut", "Sarkaghat", "Baldwara"],
    "Shimla": ["Shimla", "Rampur", "Rohru", "Theog", "Narkanda", "Kufri", "Chail", "Jubbal", "Kotkhai", "Kandaghat", "Chaupal"],
    "Sirmaur": ["Nahan", "Paonta Sahib", "Rajgarh", "Shillai", "Pachhad"],
    "Solan": ["Solan", "Parwanoo", "Baddi", "Nalagarh", "Kasauli", "Arki", "Baddi-Nalagarh (industrial hub)"],
    "Una": ["Una", "Amb", "Santokhgarh", "Daulatpur", "Gagret"]
  }
},
 "Jharkhand": {
  districts: {
    "Bokaro": ["Bokaro Steel City", "Chas", "Phusro", "Chandrapura"],
    "Chatra": ["Chatra"],
    "Deoghar": ["Deoghar", "Jasidih", "Mohanpur"],
    "Dhanbad": ["Dhanbad", "Jharia", "Sindri", "Nirsa", "Chirkunda"],
    "Dumka": ["Dumka"],
    "East Singhbhum": ["Jamshedpur", "Adityapur", "Gamharia", "Mango", "Jugsalai"],
    "Garhwa": ["Garhwa"],
    "Giridih": ["Giridih", "Dumri", "Bermo (nearby)"],
    "Godda": ["Godda"],
    "Gumla": ["Gumla"],
    "Hazaribagh": ["Hazaribagh", "Barkattha"],
    "Jamtara": ["Jamtara"],
    "Khunti": ["Khunti"],
    "Koderma": ["Koderma", "Jhumri Telaiya"],
    "Latehar": ["Latehar", "Medininagar (Daltonganj nearby in Palamu)"],
    "Lohardaga": ["Lohardaga"],
    "Pakur": ["Pakur"],
    "Palamu": ["Medininagar (Daltonganj)", "Hussainabad"],
    "Ramgarh": ["Ramgarh", "Barka Kana"],
    "Ranchi": ["Ranchi", "Hatia", "Namkum", "Kanke", "Bundu"],
    "Sahibganj": ["Sahibganj"],
    "Saraikela Kharsawan": ["Saraikela", "Kharsawan"],
    "Simdega": ["Simdega"],
    "West Singhbhum": ["Chaibasa", "Chakradharpur", "Kiriburu", "Noamundi"]
  }
},
 "Karnataka": {
  districts: {
    "Bagalkot": ["Bagalkot", "Jamkhandi", "Mudhol"],
    "Ballari": ["Ballari", "Hospet", "Sandur", "Kudligi"],
    "Belagavi": ["Belagavi", "Gokak", "Chikodi", "Khanapur", "Sankeshwar"],
    "Bengaluru Urban": ["Bengaluru", "Yelahanka", "Whitefield", "Koramangala", "JP Nagar", "Electronic City", "Indiranagar", "Marathahalli"],
    "Bengaluru Rural": ["Doddaballapur", "Devanahalli", "Nelamangala", "Hosakote"],
    "Bidar": ["Bidar"],
    "Chamarajanagar": ["Chamarajanagar", "Kollegal", "Gundlupet"],
    "Chikkaballapur": ["Chikkaballapur", "Chintamani"],
    "Chikkamagaluru": ["Chikkamagaluru", "Mudigere", "Koppa"],
    "Chitradurga": ["Chitradurga", "Challakere", "Hiriyur"],
    "Dakshina Kannada": ["Mangaluru", "Ullal", "Bantwal", "Puttur", "Sullia"],
    "Davanagere": ["Davanagere", "Harihar", "Channagiri"],
    "Dharwad": ["Dharwad", "Hubballi (Hubli)", "Kundgol"],
    "Gadag": ["Gadag-Betageri", "Ron", "Nargund"],
    "Hassan": ["Hassan", "Sakleshpur", "Arsikere", "Belur"],
    "Haveri": ["Haveri", "Ranebennur", "Shiggaon"],
    "Kalaburagi (Gulbarga)": ["Kalaburagi", "Sedam", "Jevargi"],
    "Kodagu": ["Madikeri", "Virajpet", "Somwarpet"],
    "Kolar": ["Kolar", "Malur", "Bangarapet"],
    "Koppal": ["Koppal", "Gangawati", "Yelburga"],
    "Mandya": ["Mandya", "Malavalli", "Krishnarajanagara"],
    "Mysuru": ["Mysuru", "Nanjangud", "Hunsur", "Piriyapatna"],
    "Raichur": ["Raichur", "Sindhanur", "Manvi"],
    "Ramanagara": ["Ramanagara", "Channapatna", "Kanakapura"],
    "Shivamogga (Shimoga)": ["Shivamogga", "Bhadravati", "Sagar", "Shikaripura"],
    "Tumakuru": ["Tumakuru", "Tiptur", "Turuvekere", "Kunigal"],
    "Udupi": ["Udupi", "Kundapura", "Karkala", "Manipal"],
    "Uttara Kannada": ["Karwar", "Sirsi", "Dandeli", "Bhatkal", "Kumta"],
    "Vijayanagara": ["Hosapete (Hospet)", "Kudligi", "Harapanahalli"],
    "Vijayapura (Bijapur)": ["Vijayapura", "Indi", "Sindagi"],
    "Yadgir": ["Yadgir", "Shahapur", "Surpur"]
  }
},
  "Kerala": {
  districts: {
    "Thiruvananthapuram": ["Thiruvananthapuram (Trivandrum)", "Attingal", "Nedumangad", "Varkala", "Neyyattinkara", "Kovalam"],
    "Kollam": ["Kollam (Quilon)", "Kottarakkara", "Punalur", "Paravur", "Karunagappally"],
    "Pathanamthitta": ["Pathanamthitta", "Adoor", "Thiruvalla", "Pandalam", "Ranni"],
    "Alappuzha": ["Alappuzha (Alleppey)", "Cherthala", "Kayamkulam", "Haripad", "Mavelikkara"],
    "Kottayam": ["Kottayam", "Changanassery (Changanacherry)", "Erattupetta", "Pala", "Vaikom"],
    "Idukki": ["Painavu (headquarters)", "Thodupuzha", "Munnar", "Kattappana", "Peermade", "Devikulam"],
    "Ernakulam": ["Kochi (Ernakulam)", "Angamaly", "Perumbavoor", "North Paravur", "Aluva", "Muvattupuzha", "Kothamangalam", "Fort Kochi"],
    "Thrissur": ["Thrissur (Trichur)", "Chalakudy", "Irinjalakuda", "Kodungallur", "Guruvayur", "Wadakanchery"],
    "Palakkad": ["Palakkad (Palghat)", "Ottapalam", "Shoranur", "Chittur", "Mannarkkad"],
    "Malappuram": ["Malappuram", "Manjeri", "Tirur", "Ponnani", "Perinthalmanna", "Nilambur"],
    "Kozhikode": ["Kozhikode (Calicut)", "Vatakara (Badagara)", "Koyilandy", "Thamarassery", "Beypore"],
    "Wayanad": ["Kalpetta", "Mananthavady", "Sulthan Bathery", "Vythiri"],
    "Kannur": ["Kannur (Cannanore)", "Thalassery (Tellicherry)", "Mattannur", "Payyanur", "Iritty"],
    "Kasaragod": ["Kasaragod", "Kanhangad", "Uppala", "Manjeshwar"]
  }
},
  "Madhya Pradesh": {
  districts: {
    "Agar Malwa": ["Agar Malwa"],
    "Alirajpur": ["Alirajpur", "Jobat"],
    "Anuppur": ["Anuppur", "Kotma"],
    "Ashoknagar": ["Ashoknagar"],
    "Balaghat": ["Balaghat", "Waraseoni"],
    "Barwani": ["Barwani", "Sendhwa"],
    "Betul": ["Betul", "Multai"],
    "Bhind": ["Bhind", "Mehgaon"],
    "Bhopal": ["Bhopal", "Mandideep", "Berasia", "Huzur"],
    "Burhanpur": ["Burhanpur", "Nepanagar"],
    "Chhatarpur": ["Chhatarpur", "Nowgong"],
    "Chhindwara": ["Chhindwara", "Parasia", "Pandhurna"],
    "Damoh": ["Damoh", "Hatta"],
    "Datia": ["Datia"],
    "Dewas": ["Dewas", "Bagli", "Sonkatch"],
    "Dhar": ["Dhar", "Kukshi", "Manawar"],
    "Dindori": ["Dindori"],
    "Guna": ["Guna", "Raghogarh"],
    "Gwalior": ["Gwalior", "Morar", "Lashkar", "Pichhore"],
    "Harda": ["Harda"],
    "Hoshangabad (Narmadapuram)": ["Narmadapuram (Hoshangabad)", "Itarsi", "Pipariya"],
    "Indore": ["Indore", "Dewas (nearby)", "Pithampur", "Mhow", "Depalpur"],
    "Jabalpur": ["Jabalpur", "Sihora", "Katni (nearby)", "Panagar"],
    "Jhabua": ["Jhabua", "Thandla"],
    "Katni": ["Katni", "Murwara"],
    "Khandwa": ["Khandwa", "Pandhana"],
    "Khargone": ["Khargone", "Kasrawad", "Sanawad"],
    "Maihar": ["Maihar"],
    "Mandla": ["Mandla", "Bichhiya"],
    "Mandsaur": ["Mandsaur", "Sitamau"],
    "Mauganj": ["Mauganj"],
    "Morena": ["Morena", "Ambah", "Joura"],
    "Narsinghpur": ["Narsinghpur", "Gadarwara"],
    "Neemuch": ["Neemuch", "Manasa"],
    "Niwari": ["Niwari"],
    "Panna": ["Panna", "Ajaygarh"],
    "Raisen": ["Raisen", "Mandideep (nearby)", "Begamganj"],
    "Rajgarh": ["Rajgarh", "Biaora", "Jirapur"],
    "Ratlam": ["Ratlam", "Jaora", "Sailana"],
    "Rewa": ["Rewa", "Mauganj (nearby)", "Sirmour"],
    "Sagar": ["Sagar", "Khurai", "Rehli"],
    "Satna": ["Satna", "Maihar", "Nagod"],
    "Sehore": ["Sehore", "Ashta", "Nasrullaganj"],
    "Seoni": ["Seoni", "Lakhnadon"],
    "Shahdol": ["Shahdol", "Jaisinghnagar"],
    "Shajapur": ["Shajapur", "Agar (nearby)", "Shujalpur"],
    "Sheopur": ["Sheopur", "Vijaypur"],
    "Shivpuri": ["Shivpuri", "Pohri"],
    "Sidhi": ["Sidhi", "Churhat"],
    "Singrauli": ["Singrauli", "Waidhan"],
    "Tikamgarh": ["Tikamgarh", "Jatara"],
    "Ujjain": ["Ujjain", "Nagda", "Badnagar", "Mahidpur"],
    "Umaria": ["Umaria", "Pali Birsinghpur"],
    "Vidisha": ["Vidisha", "Sironj", "Kurwai"]
  }
},
  "Maharashtra": {
  districts: {
    "Ahmednagar (Ahilyanagar)": ["Ahmednagar", "Shrirampur", "Sangamner", "Kopargaon"],
    "Akola": ["Akola", "Balapur"],
    "Amravati": ["Amravati", "Achalpur", "Anjangaon"],
    "Aurangabad (Chhatrapati Sambhajinagar)": ["Aurangabad", "Vaijapur", "Paithan", "Kannad"],
    "Beed": ["Beed", "Ambajogai", "Georai"],
    "Bhandara": ["Bhandara", "Tumsar"],
    "Buldhana": ["Buldhana", "Malkapur", "Chikhli"],
    "Chandrapur": ["Chandrapur", "Ballarpur", "Warora"],
    "Dhule": ["Dhule", "Shirpur", "Sakri"],
    "Gadchiroli": ["Gadchiroli", "Aheri"],
    "Gondia": ["Gondia", "Tirora"],
    "Hingoli": ["Hingoli", "Basmat"],
    "Jalgaon": ["Jalgaon", "Bhusawal", "Raver", "Chalisgaon"],
    "Jalna": ["Jalna", "Partur", "Ambad"],
    "Kolhapur": ["Kolhapur", "Ichalkaranji", "Gadhinglaj", "Shahuwadi"],
    "Latur": ["Latur", "Udgir", "Nilanga"],
    "Mumbai City": ["Mumbai (South Mumbai)", "Colaba", "Fort", "Churchgate", "Dadar", "Byculla"],
    "Mumbai Suburban": ["Mumbai (Suburbs)", "Andheri", "Borivali", "Bandra", "Juhu", "Goregaon"],
    "Nagpur": ["Nagpur", "Kamptee", "Umred", "Butibori (industrial)"],
    "Nanded": ["Nanded", "Kandhar", "Hadgaon"],
    "Nandurbar": ["Nandurbar", "Shahade", "Taloda"],
    "Nashik": ["Nashik", "Malegaon", "Niphad", "Sinnar", "Igatpuri"],
    "Osmanabad (Dharashiv)": ["Osmanabad", "Tuljapur", "Omerga"],
    "Palghar": ["Palghar", "Boisar", "Dahanu", "Vasai-Virar (nearby)"],
    "Parbhani": ["Parbhani", "Jintur", "Sailu"],
    "Pune": ["Pune", "Pimpri-Chinchwad", "Lonavala", "Baramati", "Alandi", "Talegaon"],
    "Raigad": ["Alibag", "Panvel", "Pen", "Mahad", "Uran", "Karjat"],
    "Ratnagiri": ["Ratnagiri", "Chiplun", "Khed", "Rajapur", "Dapoli"],
    "Sangli": ["Sangli", "Miraj", "Palus", "Tasgaon"],
    "Satara": ["Satara", "Karad", "Mahabaleshwar", "Wai", "Phaltan"],
    "Sindhudurg": ["Oros (headquarters)", "Kudal", "Sawantwadi", "Vengurla", "Malvan"],
    "Solapur": ["Solapur", "Pandharpur", "Barshi", "Akkalkot", "Mangalwedha"],
    "Thane": ["Thane", "Kalyan", "Dombivli", "Ulhasnagar", "Bhiwandi", "Vasai-Virar (part)"],
    "Wardha": ["Wardha", "Hinganghat"],
    "Washim": ["Washim", "Karanja"],
    "Yavatmal": ["Yavatmal", "Pusad", "Umarkhed"]
  }
},
 "Manipur": {
  districts: {
    "Bishnupur": ["Bishnupur", "Moirang", "Nambol"],
    "Chandel": ["Chandel", "Moreh"],
    "Churachandpur": ["Churachandpur", "Thanlon"],
    "Imphal East": ["Porompat", "Heingang", "Jiribam (separate but nearby)"],
    "Imphal West": ["Lamphelpat", "Imphal (main city)", "Mayang Imphal"],
    "Jiribam": ["Jiribam"],
    "Kakching": ["Kakching", "Sugnu"],
    "Kamjong": ["Kamjong"],
    "Kangpokpi": ["Kangpokpi", "Tadubi"],
    "Noney": ["Noney"],
    "Pherzawl": ["Pherzawl"],
    "Senapati": ["Senapati", "Mao", "Maram"],
    "Tamenglong": ["Tamenglong"],
    "Tengnoupal": ["Tengnoupal", "Moreh (nearby)"],
    "Thoubal": ["Thoubal", "Kakching (part)"],
    "Ukhrul": ["Ukhrul", "Jessami"]
  }
},
"Meghalaya": {
  districts: {
    "East Garo Hills": ["Williamnagar"],
    "North Garo Hills": ["Resubelpara"],
    "South Garo Hills": ["Baghmara"],
    "West Garo Hills": ["Tura", "Dadenggiri"],
    "South West Garo Hills": ["Ampati"],
    "East Khasi Hills": ["Shillong", "Cherrapunji (Sohra)", "Mawsynram", "Mawlynnong"],
    "West Khasi Hills": ["Nongstoin", "Mairang"],
    "South West Khasi Hills": ["Mawkyrwat"],
    "Ri Bhoi": ["Nongpoh"],
    "East Jaintia Hills": ["Khliehriat"],
    "West Jaintia Hills": ["Jowai", "Thadlaskein"],
    "Eastern West Khasi Hills": ["Mawkyrwat area (recent split)"]
  }
},
"Mizoram": {
  districts: {
    "Aizawl": ["Aizawl", "Saitual (nearby)"],
    "Champhai": ["Champhai", "Khawzawl"],
    "Hnahthial": ["Hnahthial"],
    "Khawzawl": ["Khawzawl"],
    "Kolasib": ["Kolasib"],
    "Lawngtlai": ["Lawngtlai"],
    "Lunglei": ["Lunglei", "Hnahthial (nearby)"],
    "Mamit": ["Mamit"],
    "Saiha": ["Saiha"],
    "Saitual": ["Saitual"],
    "Serchhip": ["Serchhip"]
  }
},
"Nagaland": {
  districts: {
    "Chümoukedima": ["Chümoukedima"],
    "Dimapur": ["Dimapur", "Chümoukedima (nearby)"],
    "Kiphire": ["Kiphire"],
    "Kohima": ["Kohima", "Viswema"],
    "Longleng": ["Longleng"],
    "Meluri": ["Meluri"],
    "Mokokchung": ["Mokokchung"],
    "Mon": ["Mon"],
    "Niuland": ["Niuland"],
    "Noklak": ["Noklak"],
    "Peren": ["Peren"],
    "Phek": ["Phek"],
    "Shamator": ["Shamator"],
    "Tseminyü": ["Tseminyü"],
    "Tuensang": ["Tuensang"],
    "Wokha": ["Wokha"],
    "Zünheboto": ["Zünheboto"]
  }
},
  "Odisha": {
  districts: {
    "Angul": ["Angul", "Talcher"],
    "Balangir": ["Balangir", "Titlagarh"],
    "Balasore (Baleswar)": ["Balasore", "Bhadrak (nearby)"],
    "Bargarh": ["Bargarh"],
    "Bhadrak": ["Bhadrak"],
    "Boudh": ["Boudh"],
    "Cuttack": ["Cuttack", "Choudwar", "Salipur"],
    "Deogarh (Debagarh)": ["Deogarh"],
    "Dhenkanal": ["Dhenkanal"],
    "Gajapati": ["Paralakhemundi"],
    "Ganjam": ["Berhampur (Brahmapur)", "Aska", "Bhanjanagar", "Chatrapur"],
    "Jagatsinghpur": ["Jagatsinghpur"],
    "Jajpur": ["Jajpur"],
    "Jharsuguda": ["Jharsuguda"],
    "Kalahandi": ["Bhawanipatna"],
    "Kandhamal": ["Phulbani"],
    "Kendrapara": ["Kendrapara"],
    "Keonjhar (Kendujhar)": ["Keonjhar"],
    "Khordha": ["Bhubaneswar", "Puri (nearby)", "Khordha", "Jatni"],
    "Koraput": ["Koraput", "Jeypore"],
    "Malkangiri": ["Malkangiri"],
    "Mayurbhanj": ["Baripada", "Rairangpur"],
    "Nabarangpur": ["Nabarangpur"],
    "Nayagarh": ["Nayagarh"],
    "Nuapada": ["Nuapada"],
    "Puri": ["Puri"],
    "Rayagada": ["Rayagada"],
    "Sambalpur": ["Sambalpur", "Jharsuguda (nearby)", "Bargarh (nearby)"],
    "Subarnapur (Sonepur)": ["Sonepur"],
    "Sundargarh": ["Sundargarh", "Rourkela", "Panposh"]
  }
},
"Punjab": {
  districts: {
    "Amritsar": ["Amritsar", "Batala", "Gurdaspur (nearby)"],
    "Barnala": ["Barnala"],
    "Bathinda": ["Bathinda", "Mansa (nearby)", "Faridkot (nearby)"],
    "Faridkot": ["Faridkot"],
    "Fatehgarh Sahib": ["Fatehgarh Sahib", "Sirhind"],
    "Fazilka": ["Fazilka"],
    "Ferozepur": ["Ferozepur", "Zira"],
    "Gurdaspur": ["Gurdaspur", "Dhariwal"],
    "Hoshiarpur": ["Hoshiarpur", "Dasuya"],
    "Jalandhar": ["Jalandhar", "Phagwara", "Nakodar"],
    "Kapurthala": ["Kapurthala", "Phagwara (nearby)"],
    "Ludhiana": ["Ludhiana", "Khanna", "Jagraon", "Samrala"],
    "Malerkotla": ["Malerkotla"],
    "Mansa": ["Mansa"],
    "Moga": ["Moga"],
    "Pathankot": ["Pathankot"],
    "Patiala": ["Patiala", "Rajpura", "Nabha", "Samana"],
    "Rupnagar (Ropar)": ["Rupnagar (Ropar)", "Morinda", "Anandpur Sahib"],
    "Sahibzada Ajit Singh Nagar (Mohali)": ["Mohali", "Kharar", "Dera Bassi", "Zirakpur"],
    "Sangrur": ["Sangrur", "Sunam"],
    "Shahid Bhagat Singh Nagar (Nawanshahr)": ["Nawanshahr", "Rahon"],
    "Sri Muktsar Sahib": ["Sri Muktsar Sahib"],
    "Tarn Taran": ["Tarn Taran"]
  }
},
"Rajasthan": {
  districts: {
    "Ajmer": ["Ajmer", "Beawar", "Kishangarh"],
    "Alwar": ["Alwar", "Behror", "Bhiwadi"],
    "Banswara": ["Banswara"],
    "Baran": ["Baran"],
    "Barmer": ["Barmer"],
    "Bharatpur": ["Bharatpur", "Deeg", "Kaman"],
    "Bhilwara": ["Bhilwara"],
    "Bikaner": ["Bikaner", "Nokha"],
    "Bundi": ["Bundi"],
    "Chittorgarh": ["Chittorgarh", "Nimbahera"],
    "Churu": ["Churu", "Sujangarh"],
    "Dausa": ["Dausa"],
    "Dholpur": ["Dholpur"],
    "Dudu": ["Dudu (retained or status check)"],
    "Dungarpur": ["Dungarpur"],
    "Ganganagar (Sri Ganganagar)": ["Sri Ganganagar", "Suratgarh"],
    "Hanumangarh": ["Hanumangarh"],
    "Jaipur": ["Jaipur", "Sanganer", "Amber", "Shahpura"],
    "Jaisalmer": ["Jaisalmer"],
    "Jalore": ["Jalore"],
    "Jhalawar": ["Jhalawar"],
    "Jhunjhunu": ["Jhunjhunu", "Pilani"],
    "Jodhpur": ["Jodhpur", "Pali (nearby)", "Barmer (nearby)"],
    "Karauli": ["Karauli"],
    "Kota": ["Kota", "Baran (nearby)", "Bundi (nearby)"],
    "Nagaur": ["Nagaur", "Merta", "Didwana"],
    "Pali": ["Pali"],
    "Pratapgarh": ["Pratapgarh"],
    "Rajsamand": ["Rajsamand"],
    "Sawai Madhopur": ["Sawai Madhopur", "Gangapur City"],
    "Sikar": ["Sikar", "Fatehpur", "Laxmangarh"],
    "Sirohi": ["Sirohi", "Mount Abu"],
    "Tonk": ["Tonk"],
    "Udaipur": ["Udaipur", "Rajsamand (nearby)", "Chittorgarh (nearby)"],
    // Note: Recent changes annulled some like Shahpura, Kekri etc., total stable at 41
  }
},
"Sikkim": {
  districts: {
    "Gangtok (East Sikkim)": ["Gangtok", "Singtam", "Rangpo"],
    "Gyalshing (West Sikkim)": ["Gyalshing", "Pelling"],
    "Mangan (North Sikkim)": ["Mangan", "Lachung", "Chungthang"],
    "Namchi (South Sikkim)": ["Namchi", "Jorethang", "Ravangla"],
    "Pakyong (East Sikkim extension)": ["Pakyong", "Rangpo (nearby)"],
    "Soreng (West Sikkim)": ["Soreng", "Jorethang (nearby)"]
  }
},
"Tamil Nadu": {
  districts: {
    "Ariyalur": ["Ariyalur"],
    "Chengalpattu": ["Chengalpattu", "Maraimalai Nagar"],
    "Chennai": ["Chennai", "Ambattur", "Avadi", "Tambaram", "Porur"],
    "Coimbatore": ["Coimbatore", "Tiruppur (nearby)", "Pollachi"],
    "Cuddalore": ["Cuddalore", "Chidambaram", "Virudhachalam"],
    "Dharmapuri": ["Dharmapuri"],
    "Dindigul": ["Dindigul", "Palani"],
    "Erode": ["Erode", "Gobichettipalayam"],
    "Kallakurichi": ["Kallakurichi"],
    "Kancheepuram": ["Kancheepuram", "Chengalpattu (nearby)"],
    "Kanyakumari": ["Nagercoil"],
    "Karur": ["Karur"],
    "Krishnagiri": ["Krishnagiri", "Hosur"],
    "Madurai": ["Madurai", "Dindigul (nearby)", "Theni (nearby)"],
    "Mayiladuthurai": ["Mayiladuthurai"],
    "Nagapattinam": ["Nagapattinam", "Velankanni"],
    "Namakkal": ["Namakkal", "Tiruchengode"],
    "Nilgiris": ["Udhagamandalam (Ooty)"],
    "Perambalur": ["Perambalur"],
    "Pudukkottai": ["Pudukkottai"],
    "Ramanathapuram": ["Ramanathapuram", "Paramakudi"],
    "Ranipet": ["Ranipet"],
    "Salem": ["Salem", "Namakkal (nearby)", "Erode (nearby)"],
    "Sivaganga": ["Sivaganga", "Karaikudi"],
    "Tenkasi": ["Tenkasi"],
    "Thanjavur": ["Thanjavur", "Kumbakonam", "Nagapattinam (nearby)"],
    "Theni": ["Theni", "Periyakulam"],
    "Thoothukudi": ["Thoothukudi", "Kovilpatti"],
    "Tiruchirappalli": ["Tiruchirappalli", "Karur (nearby)", "Perambalur (nearby)"],
    "Tirunelveli": ["Tirunelveli", "Thoothukudi (nearby)", "Nagercoil (nearby)"],
    "Tirupathur": ["Tirupathur"],
    "Tiruppur": ["Tiruppur", "Avinashi"],
    "Tiruvallur": ["Tiruvallur", "Avadi (nearby)"],
    "Tiruvannamalai": ["Tiruvannamalai"],
    "Tiruvarur": ["Tiruvarur"],
    "Vellore": ["Vellore", "Ranipet (nearby)", "Tirupattur (nearby)"],
    "Viluppuram": ["Viluppuram", "Tindivanam"],
    "Virudhunagar": ["Virudhunagar", "Sivakasi"]
  }
},
"Telangana": {
  districts: {
    "Adilabad": ["Adilabad", "Nirmal (nearby)"],
    "Bhadradri Kothagudem": ["Kothagudem", "Palvancha"],
    "Hanumakonda": ["Hanumakonda", "Warangal (nearby)"],
    "Hyderabad": ["Hyderabad", "Secunderabad", "Kukatpally", "Uppal", "Banjara Hills"],
    "Jagtial": ["Jagtial"],
    "Jangaon": ["Jangaon"],
    "Jayashankar Bhupalpally": ["Bhupalpally"],
    "Jogulamba Gadwal": ["Gadwal"],
    "Kamareddy": ["Kamareddy"],
    "Karimnagar": ["Karimnagar", "Peddapalli (nearby)", "Ramagundam"],
    "Khammam": ["Khammam", "Kothagudem (nearby)"],
    "Komaram Bheem Asifabad": ["Asifabad"],
    "Mahabubabad": ["Mahabubabad"],
    "Mahabubnagar": ["Mahabubnagar"],
    "Mancherial": ["Mancherial"],
    "Medak": ["Medak", "Siddipet (nearby)"],
    "Medchal-Malkajgiri": ["Malkajgiri", "Kompally", "Medchal", "Uppal (nearby)"],
    "Mulugu": ["Mulugu"],
    "Nagarkurnool": ["Nagarkurnool"],
    "Nalgonda": ["Nalgonda", "Suryapet (nearby)", "Miryalaguda"],
    "Narayanpet": ["Narayanpet"],
    "Nirmal": ["Nirmal"],
    "Nizamabad": ["Nizamabad", "Armoor", "Bodhan"],
    "Peddapalli": ["Peddapalli"],
    "Rajanna Sircilla": ["Sircilla"],
    "Rangareddy": ["Shamshabad", "LB Nagar", "Maheshwaram", "Hyderabad (outer)"],
    "Sangareddy": ["Sangareddy", "Patancheru", "Zaheerabad"],
    "Siddipet": ["Siddipet"],
    "Suryapet": ["Suryapet"],
    "Vikarabad": ["Vikarabad"],
    "Wanaparthy": ["Wanaparthy"],
    "Warangal": ["Warangal", "Kazipet", "Hanamkonda"],
    "Yadadri Bhuvanagiri": ["Yadadri", "Bhuvanagiri"]
  }
},
  "Tripura": {
  districts: {
    "Dhalai": ["Ambassa"],
    "Gomati": ["Udaipur"],
    "Khowai": ["Khowai"],
    "North Tripura": ["Dharmanagar", "Kailashahar"],
    "Sepahijala": ["Bishramganj"],
    "South Tripura": ["Belonia", "Udaipur (nearby)", "Sabroom"],
    "Unakoti": ["Kailashahar"],
    "West Tripura": ["Agartala", "Jirania", "Mohanpur"]
  }
},
"Uttar Pradesh": {
  districts: {
    "Agra": ["Agra", "Fatehabad", "Kheragarh"],
    "Aligarh": ["Aligarh", "Hathras", "Etah"],
    "Ambedkar Nagar": ["Akbarpur"],
    "Amethi": ["Gauriganj"],
    "Amroha": ["Amroha"],
    "Auraiya": ["Auraiya"],
    "Ayodhya (Faizabad)": ["Ayodhya", "Faizabad"],
    "Azamgarh": ["Azamgarh"],
    "Baghpat": ["Baghpat"],
    "Bahraich": ["Bahraich"],
    "Ballia": ["Ballia"],
    "Balrampur": ["Balrampur"],
    "Banda": ["Banda"],
    "Barabanki": ["Barabanki"],
    "Bareilly": ["Bareilly", "Pilibhit (nearby)", "Shahjahanpur (nearby)"],
    "Basti": ["Basti"],
    "Bhadohi": ["Gyanpur"],
    "Bijnor": ["Bijnor"],
    "Budaun": ["Budaun"],
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
    "Gorakhpur": ["Gorakhpur", "Deoria (nearby)", "Basti (nearby)"],
    "Hamirpur": ["Hamirpur"],
    "Hapur": ["Hapur"],
    "Hardoi": ["Hardoi"],
    "Hathras": ["Hathras"],
    "Jalaun": ["Orai"],
    "Jaunpur": ["Jaunpur"],
    "Jhansi": ["Jhansi", "Lalitpur"],
    "Kannauj": ["Kannauj"],
    "Kanpur Dehat": ["Akbarpur"],
    "Kanpur Nagar": ["Kanpur", "Kalyanpur", "Panki"],
    "Kasganj": ["Kasganj"],
    "Kaushambi": ["Manjhanpur"],
    "Kheri": ["Lakhimpur"],
    "Kushinagar": ["Padrauna"],
    "Lalitpur": ["Lalitpur"],
    "Lucknow": ["Lucknow", "Bakshi Ka Talab", "Malihabad"],
    "Maharajganj": ["Maharajganj"],
    "Mahoba": ["Mahoba"],
    "Mainpuri": ["Mainpuri"],
    "Mathura": ["Mathura", "Vrindavan", "Govardhan"],
    "Mau": ["Mau"],
    "Meerut": ["Meerut", "Hapur (nearby)", "Baghpat (nearby)"],
    "Mirzapur": ["Mirzapur"],
    "Moradabad": ["Moradabad", "Amroha (nearby)", "Rampur (nearby)"],
    "Muzaffarnagar": ["Muzaffarnagar", "Shamli"],
    "Pilibhit": ["Pilibhit"],
    "Pratapgarh": ["Pratapgarh"],
    "Prayagraj": ["Prayagraj", "Phulpur", "Meja"],
    "Raebareli": ["Raebareli"],
    "Rampur": ["Rampur"],
    "Saharanpur": ["Saharanpur"],
    "Sambhal": ["Sambhal"],
    "Sant Kabir Nagar": ["Khalilabad"],
    "Sant Ravidas Nagar (Bhadohi)": ["Gyanpur"],
    "Shahjahanpur": ["Shahjahanpur"],
    "Shamli": ["Shamli"],
    "Shravasti": ["Shravasti"],
    "Siddharthnagar": ["Naugarh"],
    "Sitapur": ["Sitapur"],
    "Sonbhadra": ["Robertsganj"],
    "Sultanpur": ["Sultanpur"],
    "Unnao": ["Unnao"],
    "Varanasi": ["Varanasi", "Pindra"]
  }
},
"Uttarakhand": {
  districts: {
    "Almora": ["Almora", "Ranikhet"],
    "Bageshwar": ["Bageshwar"],
    "Chamoli": ["Gopeshwar", "Joshimath", "Kedarnath"],
    "Champawat": ["Champawat"],
    "Dehradun": ["Dehradun", "Rishikesh", "Haridwar (nearby)", "Roorkee (nearby)"],
    "Haridwar": ["Haridwar", "Roorkee", "Laksar"],
    "Nainital": ["Nainital", "Haldwani", "Kaladhungi"],
    "Pauri Garhwal": ["Pauri", "Kotdwar"],
    "Pithoragarh": ["Pithoragarh"],
    "Rudraprayag": ["Rudraprayag"],
    "Tehri Garhwal": ["Tehri", "Chamba", "Narendra Nagar"],
    "Udham Singh Nagar": ["Rudrapur", "Kashipur", "Jaspur"],
    "Uttarkashi": ["Uttarkashi"]
  }
},
"West Bengal": {
  districts: {
    "Alipurduar": ["Alipurduar"],
    "Bankura": ["Bankura", "Bishnupur"],
    "Birbhum": ["Suri", "Bolpur"],
    "Cooch Behar": ["Cooch Behar"],
    "Dakshin Dinajpur": ["Balurghat"],
    "Darjeeling": ["Darjeeling", "Siliguri", "Kurseong"],
    "Hooghly": ["Chinsurah", "Chandannagar", "Serampore", "Arambagh"],
    "Howrah": ["Howrah", "Uluberia", "Bally"],
    "Jalpaiguri": ["Jalpaiguri", "Alipurduar (nearby)"],
    "Jhargram": ["Jhargram"],
    "Kalimpong": ["Kalimpong"],
    "Kolkata": ["Kolkata", "Salt Lake", "Howrah (nearby)", "Serampore (nearby)"],
    "Malda": ["Malda", "English Bazar"],
    "Murshidabad": ["Berhampore", "Murshidabad", "Jangipur"],
    "Nadia": ["Krishnanagar", "Kalyani", "Ranaghat"],
    "North 24 Parganas": ["Barasat", "Barrackpore", "Dum Dum", "Bongaon"],
    "Paschim Bardhaman": ["Asansol", "Durgapur", "Raniganj"],
    "Paschim Medinipur": ["Midnapore"],
    "Purba Bardhaman": ["Bardhaman"],
    "Purba Medinipur": ["Tamluk"],
    "Purulia": ["Purulia"],
    "South 24 Parganas": ["Diamond Harbour", "Budge Budge", "Baruipur"],
    "Uttar Dinajpur": ["Raiganj"]
  }
},
"Delhi": {
  districts: {
    "Central Delhi": ["Connaught Place", "Paharganj", "Karol Bagh"],
    "Central North Delhi": ["(New - from reorganization)"],
    "East Delhi": ["Preet Vihar", "Laxmi Nagar", "Mayur Vihar"],
    "New Delhi": ["New Delhi", "Chanakyapuri", "Lodi Colony"],
    "North Delhi": ["Civil Lines", "Model Town", "Burari"],
    "North East Delhi": ["Seelampur", "Yamuna Vihar"],
    "North West Delhi": ["Rohini", "Pitampura", "Shalimar Bagh"],
    "Old Delhi": ["(New - from reorganization)"],
    "Outer North Delhi": ["(New - from reorganization)"],
    "Shahdara": ["(Dissolved in 2026 reorganization - areas merged)"],
    "South Delhi": ["Hauz Khas", "Saket", "Greater Kailash", "Okhla"],
    "South East Delhi": ["(New/expanded)"],
    "South West Delhi": ["Dwarka", "Uttam Nagar", "Palam"],
    "West Delhi": ["Rajouri Garden", "Tilak Nagar", "Vikaspuri"]
  }
},
"Jammu and Kashmir": {
  districts: {
    "Anantnag": ["Anantnag", "Kulgam"],
    "Bandipora": ["Bandipora"],
    "Baramulla": ["Baramulla", "Kupwara", "Handwara"],
    "Budgam": ["Budgam", "Chadoora"],
    "Doda": ["Doda"],
    "Ganderbal": ["Ganderbal"],
    "Jammu": ["Jammu", "Udhampur", "Kathua"],
    "Kathua": ["Kathua"],
    "Kishtwar": ["Kishtwar"],
    "Kulgam": ["Kulgam"],
    "Kupwara": ["Kupwara"],
    "Poonch": ["Poonch"],
    "Pulwama": ["Pulwama", "Shopian"],
    "Rajouri": ["Rajouri"],
    "Ramban": ["Ramban"],
    "Reasi": ["Reasi"],
    "Samba": ["Samba"],
    "Shopian": ["Shopian"],
    "Srinagar": ["Srinagar", "Ganderbal (nearby)"],
    "Udhampur": ["Udhampur"]
  }
},
"Ladakh": {
  districts: {
    "Leh": ["Leh", "Nubra"],
    "Kargil": ["Kargil", "Zanskar"],
    // Note: 5 new districts (Zanskar, Drass, Sham, Nubra, Changthang) announced in 2024, but as of March 2026, formal gazette notification and infrastructure pending; currently operational 2 districts.
  }
},
"Puducherry": {
  districts: {
    "Puducherry": ["Puducherry", "Ozhukarai"],
    "Karaikal": ["Karaikal"],
    "Mahe": ["Mahe"],
    "Yanam": ["Yanam"]
  }
},
"Chandigarh": {
  districts: {
    "Chandigarh": ["Chandigarh", "Manimajra", "Panchkula (nearby in Haryana)"]
  }
},
"Andaman and Nicobar Islands": {
  districts: {
    "South Andaman": ["Port Blair", "Aberdeen Bazaar"],
    "North and Middle Andaman": ["Mayabunder", "Diglipur"],
    "Nicobar": ["Car Nicobar"]
  }
},
"Dadra and Nagar Haveli and Daman and Diu": {
  districts: {
    "Dadra and Nagar Haveli": ["Silvassa"],
    "Daman": ["Daman"],
    "Diu": ["Diu"]
  }
},
"Lakshadweep": {
  districts: {
    "Lakshadweep": ["Kavaratti", "Agatti", "Minicoy"]
  }
}
};

const STATES = Object.keys(INDIA_LOCATION_DATA).sort();

// ─── Pincode API ──────────────────────────────────────────────────────────────
const fetchLocationByPincode = async (pincode) => {
  if (!/^\d{6}$/.test(pincode)) return null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();
    if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      return {
        state: po.State,
        district: po.District,
        city: po.Division || po.Block || po.Name,
        postOffices: data[0].PostOffice.map(p => p.Name),
      };
    }
  } catch {}
  return null;
};

// ─── UI helpers ───────────────────────────────────────────────────────────────
const inputBase = "w-full bg-slate-800/60 border rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 transition-all";
const inputNormal = `${inputBase} border-slate-700/50 focus:ring-indigo-500/30 focus:border-indigo-500/50`;
const inputError  = `${inputBase} border-red-500/60 focus:ring-red-500/30`;
const inputOk     = `${inputBase} border-emerald-500/40 focus:ring-emerald-500/20 focus:border-emerald-500/40`;

function ic(err, ok) {
  if (err) return inputError;
  if (ok)  return inputOk;
  return inputNormal;
}

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
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
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      </svg>
      {msg}
    </p>
  );
}

function AutofillBadge({ source }) {
  if (!source) return null;
  return (
    <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
      <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
      </svg>
      Auto-filled from {source}
    </span>
  );
}

export default function LocationSelector(props) {
  const {
    mode = "manual",
    showPincode = true,
    // RHF
    control, register, errors: rhfErrors, setValue, trigger,
    fieldNames = {},
    // Manual
    values: manualValues,
    onChange: manualOnChange,
    onBlur: manualOnBlur,
    errors: manualErrors,
    touched: manualTouched,
  } = props;

  const fn = {
    state:    fieldNames.state    || "state",
    district: fieldNames.district || "district",
    city:     fieldNames.city     || "city",
    pincode:  fieldNames.pincode  || "pincode",
  };

  // Local UI state
  const [selectedState,    setSelectedState]    = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity,     setSelectedCity]     = useState("");
  const [pincodeInput,     setPincodeInput]     = useState("");

  const [districts, setDistricts] = useState([]);
  const [cities,    setCities]    = useState([]);

  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeStatus,  setPincodeStatus]  = useState(null); // "ok" | "error" | null
  const [autofillSource, setAutofillSource] = useState(null); // "pincode" | "state"

  const debounceRef = useRef(null);

  // ── Sync manual values into local state on mount / external change
  useEffect(() => {
    if (mode === "manual" && manualValues) {
      if (manualValues.state    !== selectedState)    handleStateChange(manualValues.state, false);
      if (manualValues.district !== selectedDistrict) handleDistrictChange(manualValues.district, false);
      if (manualValues.city     !== selectedCity)     setSelectedCity(manualValues.city || "");
      if (manualValues.pincode  !== pincodeInput)     setPincodeInput(manualValues.pincode || "");
    }
    // eslint-disable-next-line
  }, []);

  // ── Derive districts from state
  const handleStateChange = useCallback((state, propagate = true) => {
    setSelectedState(state);
    const districtMap = INDIA_LOCATION_DATA[state]?.districts || {};
    const dList = Object.keys(districtMap).sort();
    setDistricts(dList);
    setSelectedDistrict("");
    setCities([]);
    setSelectedCity("");
    setAutofillSource(null);

    if (propagate) {
      if (mode === "rhf") {
        setValue(fn.state, state, { shouldValidate: true });
        setValue(fn.district, "", { shouldValidate: false });
        setValue(fn.city, "", { shouldValidate: false });
      } else {
        manualOnChange?.(fn.state, state);
        manualOnChange?.(fn.district, "");
        manualOnChange?.(fn.city, "");
      }
    }
  }, [mode, fn, setValue, manualOnChange]);

  // ── Derive cities from district
  const handleDistrictChange = useCallback((district, propagate = true) => {
    setSelectedDistrict(district);
    const districtMap = INDIA_LOCATION_DATA[selectedState]?.districts || {};
    const cList = (districtMap[district] || []).sort();
    setCities(cList);
    setSelectedCity("");
    setAutofillSource(null);

    if (propagate) {
      if (mode === "rhf") {
        setValue(fn.district, district, { shouldValidate: true });
        setValue(fn.city, "", { shouldValidate: false });
      } else {
        manualOnChange?.(fn.district, district);
        manualOnChange?.(fn.city, "");
      }
    }
  }, [mode, fn, setValue, manualOnChange, selectedState]);

  const handleCityChange = (city) => {
    setSelectedCity(city);
    setAutofillSource(null);
    if (mode === "rhf") {
      setValue(fn.city, city, { shouldValidate: true });
    } else {
      manualOnChange?.(fn.city, city);
    }
  };

  // ── Pincode → autofill
  const handlePincodeChange = (val) => {
    setPincodeInput(val);
    setPincodeStatus(null);
    setAutofillSource(null);

    if (mode === "rhf") setValue(fn.pincode, val, { shouldValidate: false });
    else manualOnChange?.(fn.pincode, val);

    if (!/^\d{6}$/.test(val)) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPincodeLoading(true);
      const result = await fetchLocationByPincode(val);
      setPincodeLoading(false);

      if (result) {
        setPincodeStatus("ok");

        // Match state
        const matchedState = STATES.find(
          s => s.toLowerCase() === result.state?.toLowerCase()
        );
        if (matchedState && matchedState !== selectedState) {
          handleStateChange(matchedState);

          // After state set, match district
          setTimeout(() => {
            const districtMap = INDIA_LOCATION_DATA[matchedState]?.districts || {};
            const matchedDistrict = Object.keys(districtMap).find(
              d => d.toLowerCase() === result.district?.toLowerCase()
            );
            if (matchedDistrict) {
              handleDistrictChange(matchedDistrict);
              const cList = districtMap[matchedDistrict] || [];
              const matchedCity = cList.find(c =>
                c.toLowerCase().includes(result.city?.toLowerCase())
              ) || cList[0] || result.city;
              if (matchedCity) {
                setSelectedCity(matchedCity);
                if (mode === "rhf") setValue(fn.city, matchedCity, { shouldValidate: true });
                else manualOnChange?.(fn.city, matchedCity);
              }
            }
          }, 0);
        }
        setAutofillSource("pincode");

        if (mode === "rhf") {
          setValue(fn.pincode, val, { shouldValidate: true });
          trigger?.([fn.state, fn.district, fn.city, fn.pincode]);
        } else {
          manualOnChange?.(fn.pincode, val);
        }
      } else {
        setPincodeStatus("error");
      }
    }, 500);
  };

  // ── Read errors
  const err = (key) => {
    if (mode === "rhf") return rhfErrors?.[key]?.message;
    return manualTouched?.[key] ? manualErrors?.[key] : undefined;
  };

  // ── Blur handler
  const blur = (key) => {
    if (mode === "manual") manualOnBlur?.(key);
    if (mode === "rhf") trigger?.(key);
  };

  const cityInputCls = ic(err(fn.city), selectedCity && !err(fn.city));
  const districtInputCls = ic(err(fn.district), selectedDistrict && !err(fn.district));
  const stateInputCls = ic(err(fn.state), selectedState && !err(fn.state));

  return (
    <div className="space-y-4">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Location Details</span>
        {autofillSource && <AutofillBadge source={autofillSource} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── STATE ── */}
        <div>
          <FieldLabel label="State" required />
          <select
            value={selectedState}
            onChange={e => handleStateChange(e.target.value)}
            onBlur={() => blur(fn.state)}
            className={`${stateInputCls} appearance-none`}
          >
            <option value="">Select state…</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {/* Hidden RHF registration */}
          {mode === "rhf" && (
            <input type="hidden" {...register?.(fn.state)} value={selectedState} />
          )}
          <FieldError msg={err(fn.state)} />
        </div>

        {/* ── DISTRICT ── */}
        <div>
          <FieldLabel label="District" required />
          {districts.length > 0 ? (
            <select
              value={selectedDistrict}
              onChange={e => handleDistrictChange(e.target.value)}
              onBlur={() => blur(fn.district)}
              className={`${districtInputCls} appearance-none`}
              disabled={!selectedState}
            >
              <option value="">Select district…</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          ) : (
            <input
              type="text"
              placeholder={selectedState ? "Enter district" : "Select state first"}
              value={selectedDistrict}
              onChange={e => {
                setSelectedDistrict(e.target.value);
                if (mode === "rhf") setValue(fn.district, e.target.value, { shouldValidate: true });
                else manualOnChange?.(fn.district, e.target.value);
              }}
              onBlur={() => blur(fn.district)}
              disabled={!selectedState}
              className={districtInputCls}
            />
          )}
          {mode === "rhf" && (
            <input type="hidden" {...register?.(fn.district)} value={selectedDistrict} />
          )}
          <FieldError msg={err(fn.district)} />
        </div>

        {/* ── CITY ── */}
        <div>
          <FieldLabel label="City / Town" required />
          {cities.length > 0 ? (
            <select
              value={selectedCity}
              onChange={e => handleCityChange(e.target.value)}
              onBlur={() => blur(fn.city)}
              className={`${cityInputCls} appearance-none`}
              disabled={!selectedDistrict}
            >
              <option value="">Select city…</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <input
              type="text"
              placeholder={selectedDistrict ? "Enter city / town" : "Select district first"}
              value={selectedCity}
              onChange={e => handleCityChange(e.target.value)}
              onBlur={() => blur(fn.city)}
              disabled={!selectedDistrict && !selectedState}
              className={cityInputCls}
            />
          )}
          {mode === "rhf" && (
            <input type="hidden" {...register?.(fn.city)} value={selectedCity} />
          )}
          <FieldError msg={err(fn.city)} />
        </div>

        {/* ── PINCODE ── */}
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
                onChange={e => handlePincodeChange(e.target.value.replace(/\D/g, ""))}
                onBlur={() => blur(fn.pincode)}
                className={ic(
                  err(fn.pincode) || pincodeStatus === "error",
                  pincodeStatus === "ok"
                ) + " pr-10"}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {pincodeLoading && <span className="text-indigo-400"><Spinner /></span>}
                {!pincodeLoading && pincodeStatus === "ok" && (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                )}
                {!pincodeLoading && pincodeStatus === "error" && (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                )}
              </div>
            </div>
            {mode === "rhf" && (
              <input type="hidden" {...register?.(fn.pincode)} value={pincodeInput} />
            )}
            {pincodeStatus === "error" && !pincodeLoading && (
              <p className="mt-1.5 text-xs text-orange-400 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Pincode not found — please fill location manually
              </p>
            )}
            {pincodeStatus === "ok" && !pincodeLoading && (
              <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1">
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                Location auto-filled from pincode
              </p>
            )}
            {!pincodeStatus && <p className="mt-1 text-xs text-slate-600">Enter pincode to auto-fill state, district & city</p>}
            <FieldError msg={err(fn.pincode)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Named exports for convenience ───────────────────────────────────────────
export { STATES, INDIA_LOCATION_DATA, fetchLocationByPincode };