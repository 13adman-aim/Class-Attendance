 const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGODB_URI; // Netlify env variable
let client = null;

async function connectDB() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db("attendanceDB").collection("records");
}

exports.handler = async (event) => {
  try {
    const collection = await connectDB();

    // Save new record
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body);

      const result = await collection.insertOne({
        ...data,
        createdAt: new Date(),
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, id: result.insertedId }),
      };
    }

    // Fetch all records
    if (event.httpMethod === "GET") {
      const records = await collection.find().sort({ createdAt: -1 }).toArray();
      return {
        statusCode: 200,
        body: JSON.stringify(records),
      };
    }

    // Delete by ID
    if (event.httpMethod === "DELETE") {
      const { id } = JSON.parse(event.body);
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Missing ID" }),
        };
      }
      await collection.deleteOne({ _id: new ObjectId(id) });
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      };
    }

    return { statusCode: 405, body: "Method Not Allowed" };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
