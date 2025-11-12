/**
 * Ticket List Component
 * 
 * Displays a list or grid of tickets with filtering and sorting options.
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TicketCard } from "./TicketCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  Grid, 
  List as ListIcon, 
  Plus, 
  Clock, 
  CheckCircle 
} from "lucide-react";
import type { Ticket } from "@/lib/types";
import { TICKET_STATUSES, getLabelByValue } from "@/lib/configuration";
import { useBrandList } from "@/hooks/useConfig";
import { useUsers } from "@/hooks/use-users";
import { EmptyState } from "@/components/common/EmptyState";

interface TicketListProps {
  tickets: Ticket[];
  isLoading?: boolean;
  showActions?: boolean;
  onAssign?: (ticketId: string) => void;
  onResolve?: (ticketId: string) => void;
}

export function TicketList({
  tickets,
  isLoading = false,
  showActions = false,
  onAssign,
  onResolve,
}: TicketListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch brands from Firestore with 24-hour cache
  const { data: brands = [], isLoading: brandsLoading } = useBrandList();
  
  // Fetch all users for assigned employee search
  const { data: allUsers = [] } = useUsers();

  // Get all unique brands from tickets (including custom brands)
  const allBrands = useMemo(() => {
    const uniqueBrands = new Set<string>();
    
    // Add all ticket brands
    tickets.forEach((ticket) => {
      if (ticket.brand) {
        uniqueBrands.add(ticket.brand);
      }
    });
    
    // Convert to array and sort
    return Array.from(uniqueBrands).sort();
  }, [tickets]);

  // Create a map of user IDs to user data for faster lookup
  const userMap = useMemo(() => {
    const map = new Map();
    allUsers.forEach((user) => {
      map.set(user.id, user);
    });
    return map;
  }, [allUsers]);

  // Enhanced hybrid filter for tickets
  const filteredTickets = tickets.filter((ticket) => {
    const query = searchQuery.toLowerCase().trim();
    
    // If no search query, only apply status and brand filters
    if (!query) {
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesBrand = brandFilter === "all" || ticket.brand === brandFilter;
      return matchesStatus && matchesBrand;
    }

    // Hybrid search across multiple fields
    const searchableFields = [
      // Product information
      ticket.productName?.toLowerCase() || "",
      ticket.productModel?.toLowerCase() || "",
      ticket.brand?.toLowerCase() || "",
      
      // Customer information
      ticket.customerName?.toLowerCase() || "",
      ticket.customerPhone?.toLowerCase() || "",
      
      // Address information
      ticket.address?.toLowerCase() || "",
      ticket.pincode?.toLowerCase() || "",
      
      // Issue details
      ticket.issueDescription?.toLowerCase() || "",
      ticket.comments?.toLowerCase() || "",
      
      // Status (search by status label)
      getLabelByValue(TICKET_STATUSES, ticket.status)?.toLowerCase() || "",
      ticket.status?.toLowerCase() || "",
    ];

    // Get assigned employee data if available
    if (ticket.assignedTo && userMap.has(ticket.assignedTo)) {
      const assignedUser = userMap.get(ticket.assignedTo);
      searchableFields.push(
        assignedUser.name?.toLowerCase() || "",
        assignedUser.email?.toLowerCase() || "",
        (assignedUser as any).department?.toLowerCase() || "",
        assignedUser.phone?.toLowerCase() || ""
      );
    }

    // Check if query matches any searchable field
    const matchesSearch = searchableFields.some((field) => 
      field.includes(query)
    );

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesBrand = brandFilter === "all" || ticket.brand === brandFilter;

    return matchesSearch && matchesStatus && matchesBrand;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product, model, brand, customer, employee, address, status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {TICKET_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                <div className="flex items-center gap-2">
                  {status.value === "open" && <Clock className="h-4 w-4" />}
                  {status.value === "closed" && <CheckCircle className="h-4 w-4" />}
                  {status.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Brand Filter */}
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {allBrands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredTickets.length} of {tickets.length} tickets
      </div>

      {/* Tickets Grid/List */}
      {filteredTickets.length === 0 ? (
        <EmptyState
          imageUrl="/no_tickets.svg"
          title={tickets.length === 0 ? "No Tickets Yet" : "No Tickets Found"}
          description={
            tickets.length === 0
              ? "Get started by creating your first service ticket. Track issues, assign technicians, and manage resolutions all in one place."
              : "Try adjusting your filters or search query to find what you're looking for."
          }
          cta={
            tickets.length === 0 ? (
              <Button asChild>
                <Link href="/create-ticket">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Ticket
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              : "flex flex-col gap-4"
          }
        >
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              showActions={showActions}
              onAssign={onAssign}
              onResolve={onResolve}
            />
          ))}
        </div>
      )}
    </div>
  );
}
