/*
Copyright (c) 2026 Red Hat Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific
language governing permissions and limitations under the License.
*/

package controllers

import (
	"context"
	"errors"
	"fmt"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// CascadePage is one page of child resources returned by a cascade delete list function.
type CascadePage[T any] struct {
	Items []T
	Size  int32
	Total int32
}

// CascadeDeleteOptions describes how to list and delete one kind of child resource.
// Signal is optional; when provided, it is called for children already being deleted so
// their reconciler can make progress on the next pass.
type CascadeDeleteOptions[T any] struct {
	Resource          string
	ListName          string
	ActionContext     string
	PageSize          int32
	WaitForDeleting   bool
	PendingOnNotFound bool
	List              func(context.Context, int32, int32) (*CascadePage[T], error)
	ID                func(T) string
	IsDeleting        func(T) bool
	Delete            func(context.Context, string) error
	Signal            func(context.Context, string) error
	OnDelete          func(context.Context, string)
	OnSignal          func(context.Context, string)
}

// CascadeDelete requests deletion of every listed child resource. It returns pending
// when it requests a deletion, signals an existing deletion, or WaitForDeleting is set
// for a child already being deleted. Callers decide whether to wait, requeue, or continue
// with other cleanup while child deletion proceeds.
func CascadeDelete[T any](ctx context.Context, options CascadeDeleteOptions[T]) (pending bool, err error) {
	if options.Resource == "" {
		return false, errors.New("cascade resource name is required")
	}
	if options.List == nil || options.ID == nil || options.Delete == nil {
		return false, fmt.Errorf("cascade %s requires list, ID, and delete functions", options.Resource)
	}
	if options.PageSize <= 0 {
		options.PageSize = 100
	}
	listName := options.ListName
	if listName == "" {
		listName = options.Resource
	}

	var (
		offset int32
		total  *int32
		items  []T
	)
	for {
		page, listErr := options.List(ctx, offset, options.PageSize)
		if listErr != nil {
			return false, fmt.Errorf("failed to list %s: %w", listName, listErr)
		}
		if page == nil || page.Size < 0 || int64(page.Size) != int64(len(page.Items)) || page.Total < 0 {
			return false, fmt.Errorf("%s listing returned an invalid page", options.Resource)
		}
		if total == nil {
			pageTotal := page.Total
			total = &pageTotal
		} else if *total != page.Total {
			return false, fmt.Errorf("%s listing total changed during cascade deletion", options.Resource)
		}
		items = append(items, page.Items...)
		if int64(len(items)) > int64(*total) {
			return false, fmt.Errorf("%s listing returned more items than its total", options.Resource)
		}
		if int64(len(items)) == int64(*total) {
			break
		}
		if page.Size == 0 {
			return false, fmt.Errorf("%s listing returned an incomplete page", options.Resource)
		}
		offset += page.Size
	}

	var deletionErrors []error
	for _, item := range items {
		id := options.ID(item)
		if options.IsDeleting != nil && options.IsDeleting(item) {
			if options.Signal == nil {
				pending = pending || options.WaitForDeleting
				continue
			}
			pending = true
			if signalErr := options.Signal(ctx, id); signalErr != nil && status.Code(signalErr) != codes.NotFound {
				deletionErrors = append(deletionErrors,
					fmt.Errorf("failed to signal %s %s%s: %w", options.Resource, id, options.ActionContext, signalErr))
				continue
			}
			if options.OnSignal != nil {
				options.OnSignal(ctx, id)
			}
			continue
		}

		if deleteErr := options.Delete(ctx, id); deleteErr != nil {
			if status.Code(deleteErr) == codes.NotFound {
				pending = pending || options.PendingOnNotFound
				continue
			}
			pending = true
			deletionErrors = append(deletionErrors,
				fmt.Errorf("failed to delete %s %s%s: %w", options.Resource, id, options.ActionContext, deleteErr))
			continue
		}
		pending = true
		if options.OnDelete != nil {
			options.OnDelete(ctx, id)
		}
	}

	return pending, errors.Join(deletionErrors...)
}
