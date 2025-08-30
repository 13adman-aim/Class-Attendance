const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI; // stored in Netlify env vars
const client = new MongoClient(uri);

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    const data = JSON.parse(event.body);

    await client.connect();
    const database = client.db("attendanceDB"); // database name
    const collection = database.collection("records");

    const result = await collection.insertOne({
      ...data,
      createdAt: new Date(),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, id: result.insertedId }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
