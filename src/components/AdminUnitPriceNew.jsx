import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  Plus, Edit2, Save, X, AlertCircle, CheckCircle
} from 'lucide-react';

const AdminUnitPriceNew = () => {
  const { user, profile } = useAuth();
  const [unitPrices, setUnitPrices] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [newPrice, setNewPrice] = useState({
    unit_price: '',
    price_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchUnitPrices();
    }
  }, [profile]);

  const fetchUnitPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('unit_prices')
        .select('*')
        .order('price_date', { ascending: false });

      if (error) throw error;
      
      setUnitPrices(data || []);
      setCurrentPrice(data?.[0] || null);
    } catch (error) {
      console.error('Error fetching unit prices:', error);
      setMessage({ type: 'error', text: 'Failed to load unit prices' });
    } finally {
      setLoading(false);
    }
  };

  const addUnitPrice = async () => {
    if (!newPrice.unit_price || !newPrice.price_date) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      const { error } = await supabase
        .from('unit_prices')
        .insert([{
          unit_price: parseFloat(newPrice.unit_price),
          price_date: newPrice.price_date,
          notes: newPrice.notes
        }]);

      if (error) throw error;
      
      await fetchUnitPrices();
      setShowAddForm(false);
      setNewPrice({
        unit_price: '',
        price_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setMessage({ type: 'success', text: 'Unit price added successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error adding unit price:', error);
      setMessage({ type: 'error', text: 'Failed to add unit price' });
    }
  };

  const updateUnitPrice = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('unit_prices')
        .update({
          ...updates,
          unit_price: parseFloat(updates.unit_price),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      await fetchUnitPrices();
      setEditingPrice(null);
      setMessage({ type: 'success', text: 'Unit price updated successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating unit price:', error);
      setMessage({ type: 'error', text: 'Failed to update unit price' });
    }
  };

  const deleteUnitPrice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this unit price?')) return;

    try {
      const { error } = await supabase
        .from('unit_prices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchUnitPrices();
      setMessage({ type: 'success', text: 'Unit price deleted successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error deleting unit price:', error);
      setMessage({ type: 'error', text: 'Failed to delete unit price' });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculatePriceChange = () => {
    if (unitPrices.length < 2) return null;
    const current = unitPrices[0].unit_price;
    const previous = unitPrices[1].unit_price;
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: change,
      amount: current - previous,
      isPositive: change >= 0
    };
  };

  const priceChange = calculatePriceChange();

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl">Loading unit prices...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
            <DollarSign className="mr-4 text-green-400" />
            Unit Price Management
          </h1>
          <p className="text-blue-200">Manage unit prices and track price history</p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white`}>
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {message.text}
            </div>
          </div>
        )}

        {/* Current Price Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Current Unit Price</p>
                <p className="text-3xl font-bold text-white">
                  {currentPrice ? formatCurrency(currentPrice.unit_price) : '$0.0000'}
                </p>
                <p className="text-blue-200 text-sm mt-1">
                  {currentPrice ? `As of ${formatDate(currentPrice.price_date)}` : 'No prices set'}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-green-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Price Change</p>
                {priceChange ? (
                  <>
                    <p className={`text-2xl font-bold ${priceChange.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {priceChange.isPositive ? '+' : ''}{priceChange.percentage.toFixed(2)}%
                    </p>
                    <p className={`text-sm ${priceChange.isPositive ? 'text-green-300' : 'text-red-300'}`}>
                      {priceChange.isPositive ? '+' : ''}{formatCurrency(priceChange.amount)}
                    </p>
                  </>
                ) : (
                  <p className="text-xl font-bold text-gray-400">N/A</p>
                )}
              </div>
              {priceChange && priceChange.isPositive ? (
                <TrendingUp className="w-12 h-12 text-green-400" />
              ) : (
                <TrendingDown className="w-12 h-12 text-red-400" />
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Total Price History</p>
                <p className="text-2xl font-bold text-white">{unitPrices.length}</p>
                <p className="text-blue-200 text-sm">Price entries</p>
              </div>
              <Calendar className="w-12 h-12 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Add Price Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Set New Unit Price
          </button>
        </div>

        {/* Add Price Form */}
        {showAddForm && (
          <div className="mb-6 p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Add New Unit Price</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Unit Price *</label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="0.0000"
                  value={newPrice.unit_price}
                  onChange={(e) => setNewPrice({...newPrice, unit_price: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Date *</label>
                <input
                  type="date"
                  value={newPrice.price_date}
                  onChange={(e) => setNewPrice({...newPrice, price_date: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes"
                  value={newPrice.notes}
                  onChange={(e) => setNewPrice({...newPrice, notes: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={addUnitPrice}
                disabled={!newPrice.unit_price || !newPrice.price_date}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4 mr-2 inline" />
                Add Price
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Price History Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border border-white/20">
          <div className="px-6 py-4 bg-white/5 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Price History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {unitPrices.map((price, index) => {
                  const previousPrice = unitPrices[index + 1];
                  const change = previousPrice ? 
                    ((price.unit_price - previousPrice.unit_price) / previousPrice.unit_price) * 100 : null;
                  
                  return (
                    <UnitPriceRow
                      key={price.id}
                      price={price}
                      change={change}
                      isEditing={editingPrice === price.id}
                      onEdit={(id) => setEditingPrice(id)}
                      onSave={(id, updates) => updateUnitPrice(id, updates)}
                      onCancel={() => setEditingPrice(null)}
                      onDelete={deleteUnitPrice}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {unitPrices.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No unit prices have been set yet.
          </div>
        )}
      </div>
    </div>
  );
};

// Unit Price Row Component
const UnitPriceRow = ({ 
  price, change, isEditing, onEdit, onSave, onCancel, onDelete, 
  formatCurrency, formatDate 
}) => {
  const [editData, setEditData] = useState({
    unit_price: price.unit_price.toString(),
    price_date: price.price_date,
    notes: price.notes || ''
  });

  const handleSave = () => {
    onSave(price.id, editData);
  };

  if (isEditing) {
    return (
      <tr className="bg-white/5">
        <td className="px-6 py-4">
          <input
            type="date"
            value={editData.price_date}
            onChange={(e) => setEditData({...editData, price_date: e.target.value})}
            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-sm text-white"
          />
        </td>
        <td className="px-6 py-4">
          <input
            type="number"
            step="0.0001"
            value={editData.unit_price}
            onChange={(e) => setEditData({...editData, unit_price: e.target.value})}
            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-sm text-white"
          />
        </td>
        <td className="px-6 py-4">
          <span className="text-blue-200">Calculated</span>
        </td>
        <td className="px-6 py-4">
          <input
            type="text"
            value={editData.notes}
            onChange={(e) => setEditData({...editData, notes: e.target.value})}
            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-sm text-white placeholder-gray-400"
            placeholder="Optional notes"
          />
        </td>
        <td className="px-6 py-4">
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="text-green-400 hover:text-green-300"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-white/5">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
        {formatDate(price.price_date)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
        {formatCurrency(price.unit_price)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {change ? (
          <span className={`${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-blue-200">
        {price.notes || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(price.id)}
            className="text-blue-400 hover:text-blue-300"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(price.id)}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default AdminUnitPriceNew;