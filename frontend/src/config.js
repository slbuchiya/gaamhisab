// રસીદનો ફોટો વાપરવો હોય તો ફોટો "public" ફોલ્ડરમાં મૂકો અને અહીં તેનું નામ લખો, દા.ત. "/receipt.jpg"
// ખાલી રાખો તો સાદી ડિફોલ્ટ રસીદ આવશે.
export const RECEIPT_IMAGE = "";

// પ્રમુખ/ખજાનચી/મંત્રીનો સિક્કો + સહી (public ફોલ્ડરમાં). ખાલી રાખો તો સિક્કો નહીં આવે.
export const STAMP_IMAGE = "/sikko.png";

// ફોટા પર ક્યાં લખવું: x = ડાબેથી %, y = ઉપરથી %, size = ફોટાની પહોળાઈના %
export const RECEIPT_FIELDS = {
  // no:        { x: 75, y: 12, size: 3 },
  // date:      { x: 75, y: 18, size: 3 },
  // name:      { x: 25, y: 35, size: 3.5 },
  // amount:    { x: 25, y: 45, size: 3.5 },
  // program:   { x: 25, y: 55, size: 3 },
  // pramukh:   { x: 15, y: 85, size: 3 },
  // khajanchi: { x: 65, y: 85, size: 3 },
  // stamp:     { x: 10, y: 88, width: 28 },   // સિક્કાની જગ્યા (width = ફોટાની પહોળાઈના %)
};
