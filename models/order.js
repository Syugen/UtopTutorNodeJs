var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var orderSchema = new Schema(
    {
        order_id: {
            type: String, required: true, unique: true
        },
        username: {
            type: String, required: true
        }
    },
    {
        collection: 'orders'
    }
);

module.exports = mongoose.model('Order', orderSchema);
