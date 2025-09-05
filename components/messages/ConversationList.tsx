/**
 * Professional Deal Directory - Bloomberg Terminal Style
 * Enterprise-grade transaction communication list
 * Ultra-minimal Swiss design for professional trading environments
 */

'use client';

import { useState, useMemo } from 'react';
import type { EnhancedConversation } from '@/hooks/useEnhancedMessaging';

interface DealDirectoryProps {
  conversations: EnhancedConversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: EnhancedConversation) => void;
  loading: boolean;
  error: string | null;
  currentUserId: string;
  totalUnreadCount: number;
  securityAlerts: number;
  connectionStatus: string;
}

export default function DealDirectory({
  conversations,
  selectedConversationId,
  onSelectConversation,
  loading,
  error,
  currentUserId,
  totalUnreadCount,
  securityAlerts,
  connectionStatus
}: DealDirectoryProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'value' | 'status'>('time');

  // Professional filtering and sorting
  const processedDeals = useMemo(() => {
    let filtered = conversations;
    
    // Filter by search query
    if (filterQuery.trim()) {
      const query = filterQuery.toLowerCase();
      filtered = conversations.filter(deal => {
        const searchText = [
          deal.listing_title,
          deal.buyer_first_name,
          deal.buyer_last_name,
          deal.seller_first_name,
          deal.seller_last_name,
          deal.listing_make,
          deal.listing_model,
          deal.listing_price?.toString()
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchText.includes(query);
      });
    }
    
    // Sort by selected criteria
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return (b.listing_price || 0) - (a.listing_price || 0);
        case 'status':
          return b.unread_count - a.unread_count;
        case 'time':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
  }, [conversations, filterQuery, sortBy]);

  // Professional deal formatter
  const formatDealEntry = (conversation: EnhancedConversation) => {
    const isCurrentUserBuyer = conversation.buyer_id === currentUserId;
    const counterparty = isCurrentUserBuyer 
      ? `${conversation.seller_first_name} ${conversation.seller_last_name}`.trim()
      : `${conversation.buyer_first_name} ${conversation.buyer_last_name}`.trim();
    
    const dealValue = conversation.listing_price 
      ? `$${conversation.listing_price.toLocaleString()}`
      : 'TBD';
    
    const asset = `${conversation.listing_year || ''} ${conversation.listing_make || ''} ${conversation.listing_model || ''}`.trim();
    const dealCode = conversation.id.substring(0, 8).toUpperCase();
    
    const lastUpdate = new Date(conversation.updated_at);
    const timeCode = lastUpdate.toISOString().substring(11, 16); // HH:MM format
    
    return {
      dealCode,
      asset: asset || conversation.listing_title || 'UNTITLED ASSET',
      value: dealValue,
      counterparty: counterparty || 'UNKNOWN PARTY',
      role: isCurrentUserBuyer ? 'BUY' : 'SELL',
      unread: conversation.unread_count || 0,
      timeCode,
      status: conversation.unread_count > 0 ? 'ACTIVE' : 'IDLE'
    };
  };

  return (
    <div className="h-full bg-white border-r border-gray-300">
      {/* Terminal header */}
      <div className="h-12 bg-white border-b border-gray-300 flex items-center px-4">
        <div className="font-mono text-sm text-black font-medium">DEAL DIRECTORY</div>
        <div className="ml-auto flex items-center space-x-4">
          <div className="font-mono text-xs text-gray-600">
            {processedDeals.length} DEALS
          </div>
          {totalUnreadCount > 0 && (
            <div className="font-mono text-xs text-black">
              {totalUnreadCount} UNREAD
            </div>
          )}
        </div>
      </div>
      
      {/* Control panel */}
      <div className="h-10 bg-gray-100 border-b border-gray-300 flex items-center px-4">
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'time' | 'value' | 'status')}
          className="font-mono text-xs bg-transparent border-none text-black focus:outline-none"
        >
          <option value="time">SORT: TIME</option>
          <option value="value">SORT: VALUE</option>
          <option value="status">SORT: STATUS</option>
        </select>
        
        <div className="ml-auto">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="FILTER DEALS"
            className="font-mono text-xs bg-transparent border-none text-black placeholder-gray-600 focus:outline-none w-32"
          />
        </div>
      </div>
      
      {/* Connection status bar */}
      <div className="h-6 bg-white border-b border-gray-300 flex items-center px-4">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 ${connectionStatus === 'connected' ? 'bg-black' : 'bg-gray-400'}`}></div>
          <div className="font-mono text-xs text-gray-600">
            {connectionStatus === 'connected' ? 'LIVE' : 'CONNECTING'}
          </div>
          {securityAlerts > 0 && (
            <>
              <div className="w-px h-3 bg-gray-300 mx-2"></div>
              <div className="font-mono text-xs text-black">⚠ {securityAlerts} ALERTS</div>
            </>
          )}
        </div>
      </div>
      
      {/* Professional deal list */}
      <div className="flex-1 overflow-y-auto">
        {loading && processedDeals.length === 0 ? (
          <div className="p-8 text-center">
            <div className="font-mono text-sm text-gray-600 mb-2">LOADING DEAL DATA...</div>
            <div className="w-4 h-4 border border-gray-300 border-t-black rounded-full animate-spin mx-auto"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="font-mono text-sm text-black mb-2">CONNECTION ERROR</div>
            <div className="font-mono text-xs text-gray-600">{error}</div>
          </div>
        ) : processedDeals.length === 0 ? (
          <div className="p-8 text-center">
            <div className="font-mono text-sm text-black mb-2">NO ACTIVE DEALS</div>
            <div className="font-mono text-xs text-gray-600 mb-4">
              {filterQuery ? 'NO MATCHES FOR FILTER' : 'NO TRANSACTIONS INITIATED'}
            </div>
            {!filterQuery && (
              <button 
                onClick={() => window.location.href = '/listings'}
                className="font-mono text-xs bg-black text-white px-4 py-2 border border-black hover:bg-gray-900"
              >
                BROWSE ASSETS
              </button>
            )}
          </div>
        ) : (
          processedDeals.map((conversation) => {
            const deal = formatDealEntry(conversation);
            const isSelected = conversation.id === selectedConversationId;
            
            return (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`border-b border-gray-300 py-3 px-4 cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-black text-white' 
                    : 'hover:bg-gray-50'
                }`}
              >
                {/* Deal header line */}
                <div className="flex items-center justify-between mb-1">
                  <div className="font-mono text-xs font-medium">
                    {deal.dealCode}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="font-mono text-xs">
                      {deal.role}
                    </div>
                    <div className="font-mono text-xs">
                      {deal.value}
                    </div>
                    <div className="font-mono text-xs">
                      {deal.timeCode}
                    </div>
                    {deal.unread > 0 && (
                      <div className="font-mono text-xs font-medium">
                        [{deal.unread}]
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Asset description */}
                <div className={`font-mono text-xs ${
                  isSelected ? 'text-gray-300' : 'text-gray-600'
                } mb-1`}>
                  {deal.asset}
                </div>
                
                {/* Counterparty */}
                <div className={`font-mono text-xs ${
                  isSelected ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  WITH: {deal.counterparty}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Export both names for compatibility
export { DealDirectory };
export { DealDirectory as ConversationList };